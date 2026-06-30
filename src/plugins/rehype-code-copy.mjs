/**
 * Wrap <pre> blocks with a copy-button container for blog code blocks.
 * @returns {import('unified').Plugin}
 */
export function rehypeCodeCopy() {
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

		if (child.tagName === 'pre') {
			node.children[i] = {
				type: 'element',
				tagName: 'div',
				properties: { className: ['code-block'] },
				children: [
					{
						type: 'element',
						tagName: 'button',
						properties: {
							type: 'button',
							className: ['code-copy-btn'],
							'data-copy': 'true',
							'aria-label': 'Copy code',
						},
						children: [{ type: 'text', value: 'Copy' }],
					},
					child,
				],
			};
			continue;
		}

		visit(child);
	}
}
