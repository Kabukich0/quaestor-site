// Type shim for the @google/model-viewer custom element so JSX accepts
// <model-viewer> without complaint. The element exposes many attributes
// (camera-orbit, auto-rotate, etc.); typing them precisely would mirror
// the upstream package's typings, but for our single use site `any` is
// sufficient and keeps the component readable.

declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": any;
  }
}
