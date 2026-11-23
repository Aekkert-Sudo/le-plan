// Setzt das L & E Logo in die .exe (ohne wine)
const fs = require('fs'), path = require('path');
module.exports = async ctx => {
  if (ctx.electronPlatformName !== 'win32') return;
  const ResEdit = require('resedit');
  const exe = path.join(ctx.appOutDir, ctx.packager.appInfo.productFilename + '.exe');
  const data = fs.readFileSync(exe);
  const res = ResEdit.NtExecutableResource.from(ResEdit.NtExecutable.from(data, { ignoreCert: true }));
  const nt = ResEdit.NtExecutable.from(data, { ignoreCert: true });
  const r = ResEdit.NtExecutableResource.from(nt);
  const ico = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'build', 'icon.ico')));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(r.entries);
  const id = groups.length ? groups[0].id : 1, lang = groups.length ? groups[0].lang : 1033;
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(r.entries, id, lang, ico.icons.map(i => i.data));
  const vi = ResEdit.Resource.VersionInfo.fromEntries(r.entries)[0];
  if (vi) {
    const v = ctx.packager.appInfo.version.split('.').map(Number);
    vi.setFileVersion(...v, 0); vi.setProductVersion(...v, 0);
    const l = { lang: 1031, codepage: 1200 };
    for (const lg of vi.getAllLanguagesForStringValues()) vi.setStringValues(lg, { FileDescription: 'L & E Plan', ProductName: 'L & E Plan', CompanyName: 'L & E', OriginalFilename: 'L & E Plan.exe', LegalCopyright: '' });
    vi.outputToResourceEntries(r.entries);
  }
  r.outputResource(nt);
  fs.writeFileSync(exe, Buffer.from(nt.generate()));
};
