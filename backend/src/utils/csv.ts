// backend/src/utils/csv.ts

import { DrawRecord } from '@prisma/client';

const UTF8_BOM = '\ufeff';

/**
 * 将抽奖记录数组转换为 CSV 字符串
 */
export const toCsv = (records: DrawRecord[], rouletteName: string): string => {
    if (records.length === 0) return 'No Records Found';

    // 1. 标题行 (Headers)
    const headers = [
        'ID',
        'Roulette Name',
        'Session ID',
        'Prize Name',
        'Prize Message',
        'Idempotency Key',
        'Signature',
        'Drawn At',
        'Is Reversal'
    ].join(',');

    // 2. 数据行
    const dataRows = records.map(record => [
        record.id,
        rouletteName,
        record.sessionId || '',
        record.prizeName || 'N/A',
        record.prizeWinMessage || 'N/A',
        record.idempotencyKey,
        record.signature,
        record.createdAt.toISOString(),
        record.isReversal ? 'TRUE' : 'FALSE'
    ].map(item => `"${item}"`).join(','));

    return UTF8_BOM + [headers, ...dataRows].join('\n');
};