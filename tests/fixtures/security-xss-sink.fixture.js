// Test fixture for rule: security/xss-sink

// ruleid: security/xss-sink
const elem = <div dangerouslySetInnerHTML={{ __html: rawHtml }} />;

// ok: security/xss-sink
const elem = <div>{cleanText}</div>;
