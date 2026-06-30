/**
 * Wrap <table> elements in a scrollable container for mobile-friendly layouts.
 * @returns {import('unified').Plugin}
 */
export function rehypeWrapTables() {
	return (tree) => {
		visit(tree);
	};
}

/**
 * @param {import('hast').Root | import('hast').Element} node
 */
function visit(node) {
	if (!('children' in node) || !Array.isArray(node.children)) return;

	for (let i = 0; i < node.children.length; i++) {
		const child = node.children[i];
		if (child.type !== 'element') continue;

		if (child.tagName === 'table') {
			node.children[i] = {
				type: 'element',
				tagName: 'div',
				properties: { className: ['table-scroll'] },
				children: [child],
			};
			continue;
		}

		visit(child);
	}
}
