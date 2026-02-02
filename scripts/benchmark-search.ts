import { performance } from 'perf_hooks';

// --- Original Implementation ---
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatchesOriginal(text: string, query: string): string {
  if (!query.trim()) return text;

  const terms = query
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  let highlighted = text;
  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
    highlighted = highlighted.replace(regex, "<mark>$1</mark>");
  }

  return highlighted;
}

// --- Optimized Implementation ---
// Pre-computation helper
function createHighlightRegex(query: string): RegExp | null {
  const terms = query
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return null;

  // sort by length desc to ensure longest match wins (optional but good practice)
  terms.sort((a, b) => b.length - a.length);

  const pattern = terms.map(escapeRegex).join('|');
  return new RegExp(`(${pattern})`, "gi");
}

function highlightMatchesOptimized(text: string, regex: RegExp | null): string {
  if (!regex) return text;
  return text.replace(regex, "<mark>$1</mark>");
}

// --- Benchmark ---

const text = "The quick brown fox jumps over the lazy dog. The dog barks at the fox.";
const query = "quick fox dog";
const ITERATIONS = 100000;

console.log("--- Correctness Check ---");
console.log("Text:", text);
console.log("Query:", query);
console.log("Original:", highlightMatchesOriginal(text, query));
const regex = createHighlightRegex(query);
console.log("Optimized:", highlightMatchesOptimized(text, regex));
console.log("-------------------------\n");

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

// Test Original
const startOriginal = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  highlightMatchesOriginal(text, query);
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;
console.log(`Original: ${timeOriginal.toFixed(2)}ms`);

// Test Optimized (Simulating the hoisting: create regex ONCE, then loop)
const startOptimized = performance.now();
const compiledRegex = createHighlightRegex(query); // Compiled once
for (let i = 0; i < ITERATIONS; i++) {
  highlightMatchesOptimized(text, compiledRegex);
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;
console.log(`Optimized: ${timeOptimized.toFixed(2)}ms`);

const speedup = timeOriginal / timeOptimized;
console.log(`Speedup: ${speedup.toFixed(2)}x`);
