export function exportReport({ results, providers, endpoints, currentProviderId }) {
  if (!results || results.length === 0) {
    return;
  }

  const origin = window.location.origin;
  const domain = window.location.hostname;
  const currentProvider = providers.find((p) => p.id === currentProviderId);

  const providerResults = results.filter(
    (result) => !result.isApiTest && result.providerId === currentProviderId
  );
  const securityBlocked = providerResults.filter((res) => res.blockedBySecurity);
  const actualFailures = providerResults.filter((res) => !res.success && !res.blockedBySecurity);

  const apiResults = results.filter(
    (res) => res.isApiTest && res.apiResults?.some((r) => r.providerId === currentProviderId)
  );

  let report = `CDN Functionality Test Report\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Test Origin: ${origin}\n`;
  report += `Test Domain: ${domain}\n`;
  report += `CDN Provider: ${currentProvider?.name || 'Unknown'}\n\n`;

  const totalTests = providerResults.length;
  const passedTests = providerResults.filter((res) => res.success).length;

  report += `${currentProvider?.name || 'Provider'} Results: ${passedTests}/${totalTests} passed\n`;
  if (securityBlocked.length > 0) {
    report += `Security Blocked: ${securityBlocked.length} (✅ This is GOOD - WAF working!)\n`;
  }
  report += `Failed Tests: ${actualFailures.length}\n\n`;

  if (actualFailures.length > 0) {
    report += `ACTUAL FAILURES:\n`;
    actualFailures.forEach((result) => {
      report += `❌ ${result.endpointName || result.endpointId}\n`;
      report += `   URL: ${result.url || 'Unknown'}\n`;
      report += `   Status: ${result.status} ${result.statusText}\n`;
      if (result.error) {
        report += `   Error: ${result.error}\n`;
      }
      report += `   Duration: ${result.duration}ms\n\n`;
    });
  }

  if (securityBlocked.length > 0) {
    report += `SECURITY BLOCKS (Expected & Good):\n`;
    securityBlocked.forEach((result) => {
      report += `🛡️ ${result.endpointName || result.endpointId}\n`;
      report += `   Duration: ${result.duration}ms\n\n`;
    });
  }

  if (apiResults.length > 0) {
    const passedApi = apiResults.filter((res) => res.success).length;
    report += `API Tests: ${passedApi}/${apiResults.length} passed\n`;
    apiResults.forEach((result) => {
      const providerResult = result.apiResults?.find((r) => r.providerId === currentProviderId);
      if (providerResult) {
        const icon = providerResult.success ? '✅' : '❌';
        const statusText = providerResult.success
          ? `Status: ${providerResult.status}`
          : `Error: ${providerResult.error || providerResult.status}`;
        report += `${icon} ${result.endpointName || result.endpointId} (${statusText})\n`;
      }
    });
    report += `\n`;
  }

  const avgDuration =
    providerResults.length > 0
      ? Math.round(
          providerResults.reduce((sum, result) => sum + result.duration, 0) / providerResults.length
        )
      : 0;
  report += `Average Response Time: ${avgDuration}ms\n\n`;
  report += `─`.repeat(50) + `\n\n`;
  report += `RAW TEST RESULTS (JSON):\n`;
  report += JSON.stringify(results, null, 2);

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cdn-test-report-${domain}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

