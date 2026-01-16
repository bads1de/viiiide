/**
 * Google Fonts をシンプルに読み込むユーティリティ
 * @remotion/google-fonts の代わりに使用
 */

// フォント名をGoogle Fonts URLに変換
const fontNameToUrl = (fontFamily: string): string => {
  // スペースを+に変換
  const encodedName = fontFamily.replace(/ /g, "+");
  return `https://fonts.googleapis.com/css2?family=${encodedName}:wght@400;700;900&display=swap`;
};

// 読み込み済みフォントを追跡
const loadedFonts = new Set<string>();

/**
 * Google Font を動的に読み込む
 * CSSリンクタグをheadに追加する方式
 */
export const loadGoogleFont = (fontFamily: string): void => {
  if (!fontFamily || loadedFonts.has(fontFamily)) {
    return;
  }

  const linkId = `google-font-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;

  // 既にリンクが存在するか確認
  if (document.getElementById(linkId)) {
    loadedFonts.add(fontFamily);
    return;
  }

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = fontNameToUrl(fontFamily);

  link.onload = () => {
    loadedFonts.add(fontFamily);
  };

  link.onerror = () => {
    // Silently fail
  };

  document.head.appendChild(link);
};

/**
 * フォントがロード済みかチェック
 */
export const isFontLoaded = (fontFamily: string): boolean => {
  return loadedFonts.has(fontFamily);
};

// 人気のあるフォントリスト（FontPickerで使用）
export const POPULAR_FONTS = [
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Raleway",
  "Poppins",
  "Noto Sans JP",
  "Noto Serif JP",
  "M PLUS Rounded 1c",
  "Kosugi Maru",
  "Sawarabi Gothic",
  "Bebas Neue",
  "Anton",
  "Bangers",
  "Permanent Marker",
  "Pacifico",
  "Lobster",
  "Dancing Script",
  "Shadows Into Light",
  "Indie Flower",
  "Amatic SC",
  "Comfortaa",
  "Righteous",
  "Fredoka One",
  "Titan One",
  "Bungee",
  "Abril Fatface",
  "Playfair Display",
  "Merriweather",
];
