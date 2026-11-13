// Stop early with a clear message when Node.js is too old for Vite / MongoDB tools
export const checkNode = () => {
  const [major, minor] = process.versions.node.split('.').map(Number);

  if (major < 20 || (major === 20 && minor < 19)) {
    console.error(
      `\nThis project needs Node.js 20.19 or newer. You have ${process.versions.node}.\n` +
        'Install the LTS version from https://nodejs.org, close this window, and try again.\n',
    );
    process.exit(1);
  }
};
