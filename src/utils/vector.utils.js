/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} a - First vector
 * @param {Array<number>} b - Second vector
 * @returns {number} Cosine similarity (-1 to 1)
 */
const cosineSimilarity = (a, b) => {
    if (a.length === 0 || b.length === 0 || a.length !== b.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };
  
  /**
   * Create a zero vector of specified dimension
   * @param {number} dimension - Vector dimension
   * @returns {Array<number>} Zero vector
   */
  const createZeroVector = (dimension) => {
    return new Array(dimension).fill(0);
  };
  
  /**
   * Update a user preference vector based on product interaction
   * @param {Array<number>} userVector - User preference vector
   * @param {Array<number>} productVector - Product embedding vector
   * @param {string} interactionType - Type of interaction
   * @param {number} learningRate - How much to update the vector (0 to 1)
   * @returns {Array<number>} Updated user preference vector
   */
  const updatePreferenceVector = (userVector, productVector, interactionType, learningRate = 0.1) => {
    // If user vector is empty, initialize it with the same dimension as product vector
    if (userVector.length === 0) {
      userVector = createZeroVector(productVector.length);
    }
    
    // Calculate the direction to move the user vector
    const direction = productVector.map((val, i) => {
      // For likes and favorites, move towards the product vector
      if (interactionType === 'like' || interactionType === 'favorite') {
        return val - userVector[i];
      }
      // For dislikes, move away from the product vector
      else if (interactionType === 'dislike') {
        return userVector[i] - val;
      }
      // For neutral, make a smaller move towards the product vector
      else {
        return (val - userVector[i]) * 0.3;
      }
    });
    
    // Apply the update with the learning rate
    const multiplier = interactionType === 'favorite' ? learningRate * 1.5 : learningRate;
    
    return userVector.map((val, i) => val + direction[i] * multiplier);
  };
  
  module.exports = {
    cosineSimilarity,
    createZeroVector,
    updatePreferenceVector,
  };