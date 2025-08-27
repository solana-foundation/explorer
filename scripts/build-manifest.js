// eslint-disable-next-line
const fs = require('fs');

// eslint-disable-next-line
const buildMeta = require('../.next/build-manifest.json');
// eslint-disable-next-line
const appBuildMeta = require('../.next/app-build-manifest.json');

const buildManifest = () => {
  if (!buildMeta || !appBuildMeta || !appBuildMeta.pages) {
    return;
  }

  fs.copyFileSync('.next/build-manifest.json', '.next/build-manifest.temp.json');

  buildMeta.pages = {
    ...buildMeta.pages,
    ...appBuildMeta.pages,
  };

  const rawData = JSON.stringify(buildMeta, null, '\t');

  fs.writeFileSync('.next/build-manifest.json', rawData);
};

buildManifest();
