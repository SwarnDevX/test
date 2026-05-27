-- Seed: tags
INSERT INTO tags (slug, name) VALUES
    ('array',               'Array'),
    ('hash-table',          'Hash Table'),
    ('two-pointers',        'Two Pointers'),
    ('string',              'String'),
    ('stack',               'Stack'),
    ('linked-list',         'Linked List'),
    ('binary-search',       'Binary Search'),
    ('dynamic-programming', 'Dynamic Programming'),
    ('tree',                'Tree'),
    ('graph',               'Graph'),
    ('sliding-window',      'Sliding Window'),
    ('recursion',           'Recursion'),
    ('math',                'Math');

-- ─── Problem 1: Two Sum ─────────────────────────────────────────────────────
INSERT INTO problems (slug, number, title, difficulty, body_markdown, constraints_markdown, acceptance_rate, time_limit_ms, memory_limit_mb)
VALUES (
    'two-sum', 1, 'Two Sum', 'EASY',
    E'Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    E'- `2 <= nums.length <= 10^4`\n- `-10^9 <= nums[i] <= 10^9`\n- `-10^9 <= target <= 10^9`\n- **Only one valid answer exists.**',
    49.50, 2000, 256
);

INSERT INTO problem_tags (problem_id, tag_id)
SELECT p.id, t.id FROM problems p, tags t
WHERE p.slug = 'two-sum' AND t.slug IN ('array','hash-table');

INSERT INTO problem_examples (problem_id, input, output, explanation, sort_order)
SELECT id, '[2,7,11,15]
9', '[0,1]', 'Because nums[0] + nums[1] == 9, we return [0, 1].', 0 FROM problems WHERE slug='two-sum'
UNION ALL
SELECT id, '[3,2,4]
6', '[1,2]', NULL, 1 FROM problems WHERE slug='two-sum'
UNION ALL
SELECT id, '[3,3]
6', '[0,1]', NULL, 2 FROM problems WHERE slug='two-sum';

INSERT INTO sample_test_cases (problem_id, input, expected_output, sort_order)
SELECT id, '[2,7,11,15]
9', '[0,1]', 0 FROM problems WHERE slug='two-sum'
UNION ALL
SELECT id, '[3,2,4]
6', '[1,2]', 1 FROM problems WHERE slug='two-sum';

INSERT INTO test_cases (problem_id, input, expected_output, sort_order, is_sample)
SELECT id, '[2,7,11,15]
9', '[0,1]', 0, true FROM problems WHERE slug='two-sum'
UNION ALL
SELECT id, '[3,2,4]
6', '[1,2]', 1, true FROM problems WHERE slug='two-sum'
UNION ALL
SELECT id, '[3,3]
6', '[0,1]', 2, false FROM problems WHERE slug='two-sum'
UNION ALL
SELECT id, '[-1,-2,-3,-4,-5]
-8', '[-4,-5] or [2,3]', 3, false FROM problems WHERE slug='two-sum';

INSERT INTO problem_languages (problem_id, language, starter_code)
SELECT id, 'java', E'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n    }\n}' FROM problems WHERE slug='two-sum'
UNION ALL
SELECT id, 'python', E'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Your code here\n        pass' FROM problems WHERE slug='two-sum'
UNION ALL
SELECT id, 'cpp', E'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your code here\n    }\n};' FROM problems WHERE slug='two-sum'
UNION ALL
SELECT id, 'javascript', E'/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Your code here\n};' FROM problems WHERE slug='two-sum'
UNION ALL
SELECT id, 'go', E'func twoSum(nums []int, target int) []int {\n    // Your code here\n    return nil\n}' FROM problems WHERE slug='two-sum';

-- ─── Problem 2: Valid Parentheses ───────────────────────────────────────────
INSERT INTO problems (slug, number, title, difficulty, body_markdown, constraints_markdown, acceptance_rate, time_limit_ms, memory_limit_mb)
VALUES (
    'valid-parentheses', 20, 'Valid Parentheses', 'EASY',
    E'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    E'- `1 <= s.length <= 10^4`\n- `s` consists of parentheses only `''()[]{}`''`.',
    40.20, 2000, 256
);

INSERT INTO problem_tags (problem_id, tag_id)
SELECT p.id, t.id FROM problems p, tags t
WHERE p.slug = 'valid-parentheses' AND t.slug IN ('string','stack');

INSERT INTO problem_examples (problem_id, input, output, explanation, sort_order)
SELECT id, '()', 'true', NULL, 0 FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, '()[]{}'::TEXT, 'true', NULL, 1 FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, '(]', 'false', NULL, 2 FROM problems WHERE slug='valid-parentheses';

INSERT INTO sample_test_cases (problem_id, input, expected_output, sort_order)
SELECT id, '()', 'true', 0 FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, '()[]{}'::TEXT, 'true', 1 FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, '(]', 'false', 2 FROM problems WHERE slug='valid-parentheses';

INSERT INTO test_cases (problem_id, input, expected_output, sort_order, is_sample)
SELECT id, '()', 'true', 0, true FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, '()[]{}'::TEXT, 'true', 1, true FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, '(]', 'false', 2, true FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, '([)]', 'false', 3, false FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, '{[]}', 'true', 4, false FROM problems WHERE slug='valid-parentheses';

INSERT INTO problem_languages (problem_id, language, starter_code)
SELECT id, 'java', E'class Solution {\n    public boolean isValid(String s) {\n        // Your code here\n    }\n}' FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, 'python', E'class Solution:\n    def isValid(self, s: str) -> bool:\n        # Your code here\n        pass' FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, 'cpp', E'class Solution {\npublic:\n    bool isValid(string s) {\n        // Your code here\n    }\n};' FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, 'javascript', E'/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    // Your code here\n};' FROM problems WHERE slug='valid-parentheses'
UNION ALL
SELECT id, 'go', E'func isValid(s string) bool {\n    // Your code here\n    return false\n}' FROM problems WHERE slug='valid-parentheses';

-- ─── Problem 3: Best Time to Buy and Sell Stock ─────────────────────────────
INSERT INTO problems (slug, number, title, difficulty, body_markdown, constraints_markdown, acceptance_rate, time_limit_ms, memory_limit_mb)
VALUES (
    'best-time-to-buy-and-sell-stock', 121, 'Best Time to Buy and Sell Stock', 'EASY',
    E'You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.\n\nReturn *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return `0`.',
    E'- `1 <= prices.length <= 10^5`\n- `0 <= prices[i] <= 10^4`',
    54.60, 2000, 256
);

INSERT INTO problem_tags (problem_id, tag_id)
SELECT p.id, t.id FROM problems p, tags t
WHERE p.slug = 'best-time-to-buy-and-sell-stock' AND t.slug IN ('array','dynamic-programming');

INSERT INTO problem_examples (problem_id, input, output, explanation, sort_order)
SELECT id, '[7,1,5,3,6,4]', '5', 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.', 0 FROM problems WHERE slug='best-time-to-buy-and-sell-stock'
UNION ALL
SELECT id, '[7,6,4,3,1]', '0', 'In this case, no transactions are done and the max profit = 0.', 1 FROM problems WHERE slug='best-time-to-buy-and-sell-stock';

INSERT INTO sample_test_cases (problem_id, input, expected_output, sort_order)
SELECT id, '[7,1,5,3,6,4]', '5', 0 FROM problems WHERE slug='best-time-to-buy-and-sell-stock'
UNION ALL
SELECT id, '[7,6,4,3,1]', '0', 1 FROM problems WHERE slug='best-time-to-buy-and-sell-stock';

INSERT INTO test_cases (problem_id, input, expected_output, sort_order, is_sample)
SELECT id, '[7,1,5,3,6,4]', '5', 0, true FROM problems WHERE slug='best-time-to-buy-and-sell-stock'
UNION ALL
SELECT id, '[7,6,4,3,1]', '0', 1, true FROM problems WHERE slug='best-time-to-buy-and-sell-stock'
UNION ALL
SELECT id, '[1,2]', '1', 2, false FROM problems WHERE slug='best-time-to-buy-and-sell-stock'
UNION ALL
SELECT id, '[2,4,1]', '2', 3, false FROM problems WHERE slug='best-time-to-buy-and-sell-stock';

INSERT INTO problem_languages (problem_id, language, starter_code)
SELECT id, 'java', E'class Solution {\n    public int maxProfit(int[] prices) {\n        // Your code here\n    }\n}' FROM problems WHERE slug='best-time-to-buy-and-sell-stock'
UNION ALL
SELECT id, 'python', E'class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        # Your code here\n        pass' FROM problems WHERE slug='best-time-to-buy-and-sell-stock'
UNION ALL
SELECT id, 'cpp', E'class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Your code here\n    }\n};' FROM problems WHERE slug='best-time-to-buy-and-sell-stock'
UNION ALL
SELECT id, 'javascript', E'/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    // Your code here\n};' FROM problems WHERE slug='best-time-to-buy-and-sell-stock'
UNION ALL
SELECT id, 'go', E'func maxProfit(prices []int) int {\n    // Your code here\n    return 0\n}' FROM problems WHERE slug='best-time-to-buy-and-sell-stock';

-- ─── Problem 4: Longest Substring Without Repeating Characters ───────────────
INSERT INTO problems (slug, number, title, difficulty, body_markdown, constraints_markdown, acceptance_rate, time_limit_ms, memory_limit_mb)
VALUES (
    'longest-substring-without-repeating-characters', 3, 'Longest Substring Without Repeating Characters', 'MEDIUM',
    E'Given a string `s`, find the length of the **longest substring** without repeating characters.',
    E'- `0 <= s.length <= 5 * 10^4`\n- `s` consists of English letters, digits, symbols and spaces.',
    33.80, 2000, 256
);

INSERT INTO problem_tags (problem_id, tag_id)
SELECT p.id, t.id FROM problems p, tags t
WHERE p.slug = 'longest-substring-without-repeating-characters' AND t.slug IN ('hash-table','string','sliding-window','two-pointers');

INSERT INTO problem_examples (problem_id, input, output, explanation, sort_order)
SELECT id, '"abcabcbb"', '3', 'The answer is "abc", with the length of 3.', 0 FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, '"bbbbb"', '1', 'The answer is "b", with the length of 1.', 1 FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, '"pwwkew"', '3', 'The answer is "wke", with the length of 3.', 2 FROM problems WHERE slug='longest-substring-without-repeating-characters';

INSERT INTO sample_test_cases (problem_id, input, expected_output, sort_order)
SELECT id, 'abcabcbb', '3', 0 FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, 'bbbbb', '1', 1 FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, 'pwwkew', '3', 2 FROM problems WHERE slug='longest-substring-without-repeating-characters';

INSERT INTO test_cases (problem_id, input, expected_output, sort_order, is_sample)
SELECT id, 'abcabcbb', '3', 0, true FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, 'bbbbb', '1', 1, true FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, 'pwwkew', '3', 2, true FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, '', '0', 3, false FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, ' ', '1', 4, false FROM problems WHERE slug='longest-substring-without-repeating-characters';

INSERT INTO problem_languages (problem_id, language, starter_code)
SELECT id, 'java', E'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Your code here\n    }\n}' FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, 'python', E'class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Your code here\n        pass' FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, 'cpp', E'class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Your code here\n    }\n};' FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, 'javascript', E'/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    // Your code here\n};' FROM problems WHERE slug='longest-substring-without-repeating-characters'
UNION ALL
SELECT id, 'go', E'func lengthOfLongestSubstring(s string) int {\n    // Your code here\n    return 0\n}' FROM problems WHERE slug='longest-substring-without-repeating-characters';

-- ─── Problem 5: Coin Change ──────────────────────────────────────────────────
INSERT INTO problems (slug, number, title, difficulty, body_markdown, constraints_markdown, acceptance_rate, time_limit_ms, memory_limit_mb)
VALUES (
    'coin-change', 322, 'Coin Change', 'MEDIUM',
    E'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.',
    E'- `1 <= coins.length <= 12`\n- `1 <= coins[i] <= 2^31 - 1`\n- `0 <= amount <= 10^4`',
    43.70, 2000, 256
);

INSERT INTO problem_tags (problem_id, tag_id)
SELECT p.id, t.id FROM problems p, tags t
WHERE p.slug = 'coin-change' AND t.slug IN ('array','dynamic-programming');

INSERT INTO problem_examples (problem_id, input, output, explanation, sort_order)
SELECT id, E'[1,5,11]\n11', '3', E'11 = 1 + 5 + 5', 0 FROM problems WHERE slug='coin-change'
UNION ALL
SELECT id, E'[2]\n3', '-1', NULL, 1 FROM problems WHERE slug='coin-change'
UNION ALL
SELECT id, E'[1]\n0', '0', NULL, 2 FROM problems WHERE slug='coin-change';

INSERT INTO sample_test_cases (problem_id, input, expected_output, sort_order)
SELECT id, E'[1,5,11]\n11', '3', 0 FROM problems WHERE slug='coin-change'
UNION ALL
SELECT id, E'[2]\n3', '-1', 1 FROM problems WHERE slug='coin-change';

INSERT INTO test_cases (problem_id, input, expected_output, sort_order, is_sample)
SELECT id, E'[1,5,11]\n11', '3', 0, true FROM problems WHERE slug='coin-change'
UNION ALL
SELECT id, E'[2]\n3', '-1', 1, true FROM problems WHERE slug='coin-change'
UNION ALL
SELECT id, E'[1]\n0', '0', 2, false FROM problems WHERE slug='coin-change'
UNION ALL
SELECT id, E'[186,419,83,408]\n6249', '20', 3, false FROM problems WHERE slug='coin-change';

INSERT INTO problem_languages (problem_id, language, starter_code)
SELECT id, 'java', E'class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Your code here\n    }\n}' FROM problems WHERE slug='coin-change'
UNION ALL
SELECT id, 'python', E'class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        # Your code here\n        pass' FROM problems WHERE slug='coin-change'
UNION ALL
SELECT id, 'cpp', E'class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // Your code here\n    }\n};' FROM problems WHERE slug='coin-change'
UNION ALL
SELECT id, 'javascript', E'/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n    // Your code here\n};' FROM problems WHERE slug='coin-change'
UNION ALL
SELECT id, 'go', E'func coinChange(coins []int, amount int) int {\n    // Your code here\n    return -1\n}' FROM problems WHERE slug='coin-change';
