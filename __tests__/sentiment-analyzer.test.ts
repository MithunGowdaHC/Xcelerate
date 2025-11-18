const assert = require('assert');
const { analyzeSentiment } = require('../lib/sentiment-analyzer');

test('analyzeSentiment should return a positive score for positive text', () => {
    const result = analyzeSentiment('I love programming!');
    assert.strictEqual(result.score, 1);
});

test('analyzeSentiment should return a negative score for negative text', () => {
    const result = analyzeSentiment('I hate bugs!');
    assert.strictEqual(result.score, -1);
});

test('analyzeSentiment should return a neutral score for neutral text', () => {
    const result = analyzeSentiment('This is a sentence.');
    assert.strictEqual(result.score, 0);
});