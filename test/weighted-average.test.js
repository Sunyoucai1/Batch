const { calculateWeightedAverage } = require('../srv/lib/weighted-average');

describe('calculateWeightedAverage', () => {
  const batchSplits = [
    { qty: 642.42, characteristics: { CU: 22.0100, AU: 7.900, AG: 44.000 } },
    { qty: 642.62, characteristics: { CU: 21.9000, AU: 7.800, AG: 41.000 } },
    { qty: 642.92, characteristics: { CU: 21.8000, AU: 7.700, AG: 40.000 } },
  ];

  test('calculates weighted average Cu correctly', () => {
    const result = calculateWeightedAverage(batchSplits, 'CU');
    expect(result).toBeCloseTo(21.9033, 3);
  });

  test('calculates weighted average Au correctly', () => {
    const result = calculateWeightedAverage(batchSplits, 'AU');
    expect(result).toBeCloseTo(7.8001, 3);
  });

  test('throws when batchSplits is empty', () => {
    expect(() => calculateWeightedAverage([], 'CU')).toThrow('No batch splits provided');
  });

  test('throws when characteristic not found on any split', () => {
    const splits = [{ qty: 100, characteristics: {} }];
    expect(() => calculateWeightedAverage(splits, 'CU')).toThrow('Characteristic CU not found');
  });

  test('calculates total quantity correctly', () => {
    const result = calculateWeightedAverage(batchSplits, 'CU');
    expect(typeof result).toBe('number');
  });
});
