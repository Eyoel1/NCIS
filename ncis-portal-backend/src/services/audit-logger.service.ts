import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

export interface AuditLogInput {
  shipmentId?: string;
  actorId?: string;
  actorRole?: string;
  actorName?: string;
  action: string;
  stage?: string;
  details?: string;
  previousStateJson?: string | Record<string, any>;
  newStateJson?: string | Record<string, any>;
  ipAddress?: string;
}

export class AuditLoggerService {
  private static writeMutex: Promise<any> = Promise.resolve();

  public static calculateHash(payload: {
    previousHash: string | null;
    shipmentId: string | null;
    action: string;
    actorId: string | null;
    stage?: string | null;
    details?: string | null;
    previousStateJson?: string | null;
    newStateJson?: string | null;
    timestamp: Date | string;
  }): string {
    const rawString = [
      payload.previousHash || 'GENESIS_NCIS_HASH_2026',
      payload.shipmentId || 'GLOBAL',
      payload.action,
      payload.actorId || 'SYSTEM',
      payload.stage || '',
      payload.details || '',
      payload.previousStateJson || '',
      payload.newStateJson || '',
      new Date(payload.timestamp).toISOString(),
    ].join(':');

    return crypto.createHash('sha256').update(rawString).digest('hex');
  }

  public static async recordLog(prisma: PrismaClient, input: AuditLogInput) {
    const prevQueue = this.writeMutex;
    let releaseLock: () => void;
    this.writeMutex = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    try {
      await prevQueue.catch(() => {});
      return await this.internalRecordLog(prisma, input);
    } finally {
      releaseLock!();
    }
  }

  private static async internalRecordLog(prisma: PrismaClient, input: AuditLogInput) {
    const targetShipmentId = input.shipmentId || null;

    const lastLog = await prisma.auditLog.findFirst({
      where: { shipmentId: targetShipmentId },
      orderBy: { timestamp: 'desc' },
    });

    const previousHash = lastLog ? lastLog.hash : 'GENESIS_NCIS_HASH_2026';

    // Ensure strictly increasing monotonic timestamp
    let timestamp = new Date();
    if (lastLog && lastLog.timestamp.getTime() >= timestamp.getTime()) {
      timestamp = new Date(lastLog.timestamp.getTime() + 10);
    }

    const prevState =
      typeof input.previousStateJson === 'object' && input.previousStateJson !== null
        ? JSON.stringify(input.previousStateJson)
        : (input.previousStateJson || null);

    let nextStateObj: Record<string, any> | null = null;
    if (typeof input.newStateJson === 'object' && input.newStateJson !== null) {
      nextStateObj = { ...input.newStateJson };
    } else if (typeof input.newStateJson === 'string') {
      try {
        nextStateObj = JSON.parse(input.newStateJson);
      } catch {
        // Not JSON formatted string
      }
    }

    // Preserve original shipment ID so orphaned logs (after shipment deletion) can be verified
    if (input.shipmentId) {
      if (nextStateObj) {
        if (!nextStateObj._shipmentId) {
          nextStateObj._shipmentId = input.shipmentId;
        }
      } else if (!input.newStateJson) {
        nextStateObj = { _shipmentId: input.shipmentId };
      }
    }

    const nextState = nextStateObj
      ? JSON.stringify(nextStateObj)
      : (typeof input.newStateJson === 'string' ? input.newStateJson : null);

    const hash = this.calculateHash({
      previousHash,
      shipmentId: targetShipmentId,
      action: input.action,
      actorId: input.actorId || null,
      stage: input.stage || null,
      details: input.details || null,
      previousStateJson: prevState,
      newStateJson: nextState,
      timestamp,
    });

    return await prisma.auditLog.create({
      data: {
        shipmentId: input.shipmentId,
        actorId: input.actorId,
        actorRole: input.actorRole || 'SYSTEM',
        actorName: input.actorName || 'NCIS Platform Engine',
        action: input.action,
        stage: input.stage,
        details: input.details,
        previousStateJson: prevState,
        newStateJson: nextState,
        ipAddress: input.ipAddress || '127.0.0.1',
        timestamp,
        previousHash,
        hash,
      },
    });
  }

  public static async verifySingleChain(
    prisma: PrismaClient,
    shipmentId: string | null
  ): Promise<{ valid: boolean; totalLogs: number; brokenAtLogId?: string; message: string }> {
    const logs = await prisma.auditLog.findMany({
      where: { shipmentId },
      orderBy: { timestamp: 'asc' },
    });

    if (logs.length === 0) {
      return { valid: true, totalLogs: 0, message: 'No logs found to verify.' };
    }

    if (shipmentId === null) {
      // Group orphaned logs by original shipment ID (or GLOBAL)
      const groups = new Map<string, typeof logs>();
      for (const log of logs) {
        let originalShipmentId: string | null = null;
        if (log.newStateJson) {
          try {
            const parsed = JSON.parse(log.newStateJson);
            if (parsed && typeof parsed._shipmentId === 'string') {
              originalShipmentId = parsed._shipmentId;
            }
          } catch {}
        }
        const key = originalShipmentId || 'GLOBAL';
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(log);
      }

      let totalLogsCount = 0;
      for (const [key, groupLogs] of groups.entries()) {
        const effectiveShipmentId = key === 'GLOBAL' ? null : key;
        const res = this.verifyLogSequence(groupLogs, effectiveShipmentId);
        if (!res.valid) {
          return res;
        }
        totalLogsCount += res.totalLogs;
      }

      return {
        valid: true,
        totalLogs: totalLogsCount,
        message: `Audit chain verified successfully (${totalLogsCount} logs verified).`,
      };
    }

    return this.verifyLogSequence(logs, shipmentId);
  }

  private static verifyLogSequence(
    logs: any[],
    effectiveShipmentId: string | null
  ): { valid: boolean; totalLogs: number; brokenAtLogId?: string; message: string } {
    let expectedPreviousHash: string = 'GENESIS_NCIS_HASH_2026';

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (log.previousHash !== expectedPreviousHash) {
        return {
          valid: false,
          totalLogs: logs.length,
          brokenAtLogId: log.id,
          message: `Hash link mismatch at log ${log.id}. Expected ${expectedPreviousHash}, found ${log.previousHash}`,
        };
      }

      let hashShipmentId = effectiveShipmentId || log.shipmentId;
      if (!hashShipmentId && log.newStateJson) {
        try {
          const parsed = JSON.parse(log.newStateJson);
          if (parsed && typeof parsed._shipmentId === 'string') {
            hashShipmentId = parsed._shipmentId;
          }
        } catch {}
      }

      const calculated = this.calculateHash({
        previousHash: log.previousHash,
        shipmentId: hashShipmentId,
        action: log.action,
        actorId: log.actorId,
        stage: log.stage,
        details: log.details,
        previousStateJson: log.previousStateJson,
        newStateJson: log.newStateJson,
        timestamp: log.timestamp,
      });

      if (calculated !== log.hash) {
        return {
          valid: false,
          totalLogs: logs.length,
          brokenAtLogId: log.id,
          message: `Tampered hash at log ${log.id}. Recalculated ${calculated} != recorded ${log.hash}`,
        };
      }

      expectedPreviousHash = log.hash;
    }

    return {
      valid: true,
      totalLogs: logs.length,
      message: `Audit chain verified successfully (${logs.length} logs verified).`,
    };
  }

  public static async verifyChain(
    prisma: PrismaClient,
    shipmentId?: string
  ): Promise<{ valid: boolean; totalLogs: number; brokenAtLogId?: string; message: string }> {
    if (shipmentId) {
      return this.verifySingleChain(prisma, shipmentId);
    }

    // When verifying globally, verify each shipment chain and global logs
    const shipments = await prisma.shipment.findMany({ select: { id: true } });
    let totalVerified = 0;

    for (const s of shipments) {
      const res = await this.verifySingleChain(prisma, s.id);
      if (!res.valid) {
        return res;
      }
      totalVerified += res.totalLogs;
    }

    const globalRes = await this.verifySingleChain(prisma, null);
    if (!globalRes.valid) {
      return globalRes;
    }
    totalVerified += globalRes.totalLogs;

    return {
      valid: true,
      totalLogs: totalVerified,
      message: `Audit chain verified successfully (${totalVerified} logs verified across all chains).`,
    };
  }
}
