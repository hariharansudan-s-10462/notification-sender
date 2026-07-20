export type PathFilter = (filePath: string) => boolean;
export type RewritePath = (filePath: string) => string;

export type Rule = {
  src: string;
  type: "bundle" | "static";
  pathFilter?: PathFilter;
  rewritePath?: RewritePath;
};

export type BundlerConfiguration = {
  srcRoot: string;
  outRoot: string;
  rules: Rule[];
};

export type CopyFileParams = {
  srcPath: string;
  destPath: string;
  pathFilter?: PathFilter;
  rewritePath?: RewritePath;
};
