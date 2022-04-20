import {Path, File} from "runtime-compat";

const meta_url = new Path(import.meta.url).path;
const directory = Path.dirname(meta_url);
const preset = `${directory}/preset`;

export default class Bundler {
  constructor(conf) {
    this.conf = conf;
    this.debug = conf.debug;
    this.index = conf.files.index;
    this.scripts = [];
  }

  async copy_with_preset(subdirectory, to) {
    const {paths} = this.conf;

    // copy files preset files first
    await File.copy(`${preset}/${subdirectory}`, to);

    // copy any user code over it, not recreating the folder
    try {
      await File.copy(paths[subdirectory], to);
    } catch(error) {
      // directory doesn't exist
    }
  }

  async bundle() {
    const {paths} = this.conf;

    // remove public directory in case exists
    await File.remove(paths.public);
    // create public directory
    await File.create(paths.public);

    // copy static files to public
    await this.copy_with_preset("static", paths.public);

    // read index.html from public, then remove it (we serve it dynamically)
    await File.remove(`${paths.public}/${this.index}`);
  }
}

export const index = async conf => {
  let file;
  const subdirectory = "static";
  try {
    file = await File.read(`${conf.paths[subdirectory]}/${conf.files.index}`);
  } catch (error) {
    file = await File.read(`${preset}/${subdirectory}/${conf.files.index}`);
  }
  return file;
};
