import NodeArweave from "./node/index";
import WebArweave from "./web/index";

// this class allows for CJS imports without .default, as well as still allowing for destructured Node/WebIrys imports.
class Arweave extends NodeArweave {
  static default = Arweave;
  static NodeArweave = NodeArweave;
  static WebArweave = WebArweave;
}
export = Arweave;
