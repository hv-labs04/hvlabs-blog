---
title: "Tries"
slug: "tries"
date: "2024-04-08"
description: "The prefix tree data structure — how it enables O(L) string operations and the problems it unlocks"
tags: ["dsa", "trie", "strings", "advanced", "algorithms"]
featured: false
draft: false
module: "advanced-algorithms"
moduleOrder: 3
---

A trie (prefix tree) is a tree where each path from root to leaf encodes a string. Unlike a hash map, it shares common prefixes — making it O(L) for all operations (L = string length) and efficient for prefix-based queries.

## Structure

Each node represents a character. The path from root to any node spells a prefix; a marked node indicates a complete word.

```python
class TrieNode:
    def __init__(self):
        self.children = {}  # char → TrieNode
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True

    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return node.is_end

    def starts_with(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return True
```

All three operations are O(L). Space is O(total characters across all words).

## Why Not a Hash Map?

A hash map gives O(1) exact lookup, but:
- Prefix queries require scanning all keys — O(n · L)
- Autocomplete requires knowing all words with a prefix — O(n · L)
- Lexicographic ordering isn't inherent

A trie answers "does any word start with X?" in O(L) and retrieves all matching words in O(L + k) where k is the count.

## Word Search II (DFS + Trie)

Given a board and a list of words, find all words that exist on the board. Brute force (DFS for each word) is O(words · 4^path_length). With a trie, you DFS once and prune entire branches:

```python
def find_words(board, words):
    trie = Trie()
    for word in words:
        trie.insert(word)

    rows, cols = len(board), len(board[0])
    result = set()

    def dfs(node, r, c, path):
        ch = board[r][c]
        if ch not in node.children:
            return
        node = node.children[ch]
        path += ch
        if node.is_end:
            result.add(path)
        board[r][c] = '#'  # mark visited
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != '#':
                dfs(node, nr, nc, path)
        board[r][c] = ch  # restore

    for r in range(rows):
        for c in range(cols):
            dfs(trie.root, r, c, "")
    return list(result)
```

**Pruning optimization**: when a trie node's subtree no longer contains uncollected words, delete it to prevent redundant exploration.

## Design Search Autocomplete

A trie with a twist: each node stores the top-k hot words in its subtree. Lookup at any prefix node returns results in O(1) after O(n · L) preprocessing:

```python
class AutocompleteNode:
    def __init__(self):
        self.children = {}
        self.top_words = []  # sorted by frequency, max 3
```

On each insert, update `top_words` all the way up the path. On search, just return `node.top_words`.

## Wildcard Matching in a Trie

To support `'.'` wildcards (match any character), DFS through all children when the query character is `'.'`:

```python
class WordDictionary:
    def __init__(self):
        self.root = TrieNode()

    def add_word(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True

    def search(self, word):
        def dfs(node, i):
            if i == len(word):
                return node.is_end
            ch = word[i]
            if ch == '.':
                return any(dfs(child, i+1) for child in node.children.values())
            if ch not in node.children:
                return False
            return dfs(node.children[ch], i+1)
        return dfs(self.root, 0)
```

## Maximum XOR with Trie

A binary trie stores numbers bit by bit (from MSB to LSB). To find the number in the trie that XORs with a query to the maximum value, greedily choose the opposite bit at each level:

```python
class XorTrie:
    def __init__(self):
        self.root = {}

    def insert(self, num):
        node = self.root
        for i in range(31, -1, -1):
            bit = (num >> i) & 1
            if bit not in node:
                node[bit] = {}
            node = node[bit]

    def max_xor(self, num):
        node = self.root
        xor = 0
        for i in range(31, -1, -1):
            bit = (num >> i) & 1
            want = 1 - bit  # try to get a 1 in this XOR position
            if want in node:
                xor |= (1 << i)
                node = node[want]
            else:
                node = node[bit]
        return xor
```

## When to Use a Trie

| Problem pattern | Trie advantage |
|----------------|----------------|
| Prefix search / autocomplete | O(prefix length) lookup |
| Word search with wildcards | DFS with pruning |
| Multiple pattern matching | Share common prefixes |
| Maximum XOR of pairs | Binary trie, greedy selection |
| Lexicographic ordering | Inherent in tree structure |

## Summary

Tries are a specialized but high-value structure. The key question is "do I need to query by prefix or share prefixes efficiently?" If yes, a trie beats a hash map. The implementation is always the same: a dict of children and an `is_end` flag. Variations (counting, pruning, wildcards, binary XOR) all layer on top of this foundation.
