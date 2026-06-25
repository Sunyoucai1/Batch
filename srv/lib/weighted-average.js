function calculateWeightedAverage(batchSplits, charcName) {
  if (!batchSplits || batchSplits.length === 0) {
    throw new Error('No batch splits provided');
  }

  const hasCharc = batchSplits.some(b => b.characteristics[charcName] !== undefined);
  if (!hasCharc) {
    throw new Error(`Characteristic ${charcName} not found`);
  }

  const totalQty = batchSplits.reduce((sum, b) => sum + b.qty, 0);
  const weightedSum = batchSplits.reduce((sum, b) => {
    const val = b.characteristics[charcName] ?? 0;
    return sum + b.qty * val;
  }, 0);

  return weightedSum / totalQty;
}

module.exports = { calculateWeightedAverage };
