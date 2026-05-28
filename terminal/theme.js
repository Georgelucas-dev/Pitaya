import fs from "fs";
import os from "os";
import path from "path";

const THEME_PATH = path.join(os.homedir(), ".config/omarchy/current/theme/colors.toml");

export function loadTheme() {
  try {
    const content = fs.readFileSync(THEME_PATH, "utf8");
    const colors = {};

    for (const line of content.split("\n")) {
      const match = line.match(/^(\w+)\s*=\s*"#([0-9a-fA-F]{6})"/);
      if (match) colors[match[1]] = match[2];
    }

    return colors;
  } catch {
    return null;
  }
}

export function tc(hex) {
  if (!hex) return "";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

export function buildColors(theme) {
  const reset = "\x1b[0m";

  if (!theme) {
    return {
      logo:   (t) => `\x1b[35m${t}${reset}`,
      muted:  (t) => `\x1b[90m${t}${reset}`,
      green:  (t) => `\x1b[32m${t}${reset}`,
      purple: (t) => `\x1b[35m${t}${reset}`,
      blue:   (t) => `\x1b[34m${t}${reset}`,
      white:  (t) => `\x1b[97m${t}${reset}`,
      reset,
    };
  }

  return {
    logo:   (t) => `${tc(theme.accent)}${t}${reset}`,
    muted:  (t) => `${tc(theme.color8)}${t}${reset}`,
    green:  (t) => `${tc(theme.color2)}${t}${reset}`,
    purple: (t) => `${tc(theme.color5)}${t}${reset}`,
    blue:   (t) => `${tc(theme.color4)}${t}${reset}`,
    white:  (t) => `${tc(theme.foreground)}${t}${reset}`,
    reset,
  };
}