/*!
 * @name HittyGubbied
 * @description Personal Source
 * @version 127.0.0.1
 * @author Anyone
 * @repository https://github.com/lxmusics/lx-music-api-server
 */

//Alternate your API_LOC parameter below to your local server address, nginx autoindex preferred.
//Might need to fine tune paths
const DEV_TOOLS = false;
const API_URL = "http://192.168.1.200:9763";
const API_LOC = "http://domain or ip:port";
const API_NETEASE = "https://neteasecloudmusicapi.vercel.app";
const MUSIC_QUALITY = {
  kw: ["128k"],
  kg: ["128k"],
  tx: ["128k"],
  wy: ["128k"],
  mg: ["128k"],
};
const MUSIC_SOURCE = [...Object.keys(MUSIC_QUALITY), "local"];
const { EVENT_NAMES, request, on, send, utils, env, version } = globalThis.lx;

const httpFetch = (url, options = { method: "GET" }) =>
  new Promise((resolve, reject) => {
    request(url, options, (err, resp) => (err ? reject(err) : resolve(resp)));
  });

const base64Encode = (data) =>
  utils.buffer
    .bufToString(utils.buffer.from(data, "utf-8"), "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
const base64Decode = (data) =>
  utils.buffer.bufToString(utils.buffer.from(data, "base64"), "utf-8");

const getMusicUrl = async (source, musicInfo, quality) => {
  if (source === "local")
    return `${API_LOC}${base64Decode(base64Encode(musicInfo.songmid))}`;
  const songId = musicInfo.hash ?? musicInfo.songmid;
  if (source === "wy") {
    const { body } = await httpFetch(
      `${API_NETEASE}/song/url/v1?id=${songId}&level=standard`
    );
    return body.data[0].url;
  }
  const { body } = await httpFetch(
    `${API_URL}/url/${source}/${songId}/${quality}`
  );
  return body.data;
};

const getMusicPic = async (source, musicInfo) => {
  if (source !== "local" || !musicInfo.songmid.startsWith("server_"))
    throw new Error("Unsupported source or file");
  const songId = musicInfo.songmid.replace("server_", "");
  const requestBody = { p: songId };
  const b = base64Encode(JSON.stringify(requestBody));
  const { body } = await httpFetch(`${API_URL}/local/c?q=${b}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `lx-music-${env || "request"}/${version}`,
    },
    follow_max: 5,
  });
  if (body.code === 0 && body.data.exist) return `${API_URL}/local/p?q=${b}`;
  throw new Error("Failed to get music pic");
};

const getMusicLyric = async (source, musicInfo) => {
  if (source !== "local" || !musicInfo.songmid.startsWith("server_"))
    throw new Error("Unsupported source or file");
  const songId = musicInfo.songmid.replace("server_", "");
  const requestBody = { p: songId };
  const b = base64Encode(JSON.stringify(requestBody));
  const { body } = await httpFetch(`${API_URL}/local/c?q=${b}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `lx-music-${env || "request"}/${version}`,
    },
    follow_max: 5,
  });
  if (body.code === 0 && body.data.lyric) {
    const { body: lyricBody } = await httpFetch(`${API_URL}/local/l?q=${b}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `lx-music-${env || "request"}/${version}`,
      },
      follow_max: 5,
    });
    if (lyricBody.code === 0)
      return {
        lyric: lyricBody.data ?? "",
        tlyric: "",
        rlyric: "",
        lxlyric: "",
      };
  }
  throw new Error("Failed to get music lyric");
};

const musicSources = Object.fromEntries(
  MUSIC_SOURCE.map((item) => [
    item,
    {
      name: item,
      type: "music",
      actions: item === "local" ? ["musicUrl", "pic", "lyric"] : ["musicUrl"],
      qualitys: item === "local" ? [] : MUSIC_QUALITY[item],
    },
  ])
);

on(EVENT_NAMES.request, async ({ action, source, info }) => {
  try {
    if (action === "musicUrl")
      return await getMusicUrl(source, info.musicInfo, info.type);
    if (action === "pic") return await getMusicPic(source, info.musicInfo);
    if (action === "lyric") return await getMusicLyric(source, info.musicInfo);
    throw new Error(`Unsupported action: ${action}`);
  } catch (err) {
    return Promise.reject(err);
  }
});

send(EVENT_NAMES.inited, {
  status: true,
  openDevTools: DEV_TOOLS,
  sources: musicSources,
});
