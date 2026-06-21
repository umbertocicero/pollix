export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/svg+xml';

export default function OpenGraphImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#15101E"/>
    <rect x="64" y="64" width="96" height="96" fill="#5D8A3A"/>
    <text x="112" y="132" font-family="monospace" font-size="64" font-weight="bold" text-anchor="middle" fill="white">P</text>
    <text x="184" y="140" font-family="monospace" font-size="54" font-weight="bold" fill="#FCEE4B">Pollix</text>
    <text x="64" y="420" font-family="monospace" font-size="52" font-weight="bold" fill="#FCEE4B">Polls and Scheduling,</text>
    <text x="64" y="490" font-family="monospace" font-size="52" font-weight="bold" fill="#FCEE4B">Simplified</text>
    <text x="64" y="550" font-family="monospace" font-size="28" fill="#9A9A9A">Create polls, share links, collect votes in minutes.</text>
  </svg>`;
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}
