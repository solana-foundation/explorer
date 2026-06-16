const deps = [
    { package: 'lighthouse-sdk', packageVersion: '2.0.1', peerDependency: '@solana/web3.js', newVersion: '2.0.0' },
];

function overridesPeerDependencies(pkg) {
    if (!pkg.peerDependencies || Object.keys(pkg.peerDependencies).length === 0) return pkg;
    for (const dep of deps) {
        if (pkg.name === dep.package && pkg.version === dep.packageVersion) {
            console.log(`  🔍 Checking ${pkg.name}@${pkg.version}`);
            if (dep.peerDependency in pkg.peerDependencies) {
                try {
                    const oldVersion = pkg.peerDependencies[dep.peerDependency];
                    console.log(`    ⚡ Overriding ${dep.peerDependency}@${oldVersion} → ${dep.newVersion}`);
                    pkg.dependencies = pkg.dependencies || {};
                    pkg.dependencies[dep.peerDependency] = dep.newVersion;
                    delete pkg.peerDependencies[dep.peerDependency];
                    console.log(`    ✅ Success`);
                } catch (err) {
                    console.error(`    ❌ Failed:`, err.message);
                }
            }
        }
    }
    return pkg;
}

module.exports = {
    hooks: {
        readPackage(pkg) {
            overridesPeerDependencies(pkg);
            return pkg;
        },
    },
};
