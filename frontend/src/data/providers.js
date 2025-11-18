export const providers = [
  {
    id: 'verge',
    name: 'VergeCloud',
    emoji: '🌐',
    originUrl: 'https://test-verge-test.shop',
    hosts: ['test-verge-test.shop', 'www.test-verge-test.shop']
  },
  {
    id: 'arvan',
    name: 'ArvanCloud',
    emoji: '☁️',
    originUrl: 'https://test20250316.ir',
    hosts: ['test20250316.ir', 'www.test20250316.ir']
  }
];

export function detectProviderByHostname(hostname) {
  const provider = providers.find((p) => p.hosts.some((host) => hostname.includes(host)));
  return provider ? provider.id : null;
}

