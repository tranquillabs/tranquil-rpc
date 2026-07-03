// Builds the two Cap'n Web bundles:
//   dist/host.cjs              — host entry, CJS for the Electron renderer (atom/electron external)
//   dist/tranquil-rpc-guest.js — guest entry, self-contained IIFE injected into pages
//
// A small banner polyfills Promise.withResolvers (used by capnweb) for older V8/Electron.
import esbuild from "esbuild";

const banner = {
  js:
    "if(typeof Promise.withResolvers!=='function'){Promise.withResolvers=function(){let a,b;" +
    "const p=new Promise((x,y)=>{a=x;b=y;});return{promise:p,resolve:a,reject:b};};}",
};

await esbuild.build({
  entryPoints: ["lib/host.js"],
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["atom", "electron"],
  outfile: "dist/host.js",
  banner,
});

await esbuild.build({
  entryPoints: ["lib/guest.js"],
  bundle: true,
  format: "iife",
  globalName: "tranquilRpcGuest",
  outfile: "dist/tranquil-rpc-guest.js",
  banner,
});

console.log("tranquil-rpc: built dist/host.js + dist/tranquil-rpc-guest.js");
