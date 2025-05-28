/*!
 * @name HittyGubbied
 * @description Wocha'u lukn-ad?
 * @version 127.0.0.1
 * @author Anyone
 * @repository https://github.com/HittyGubby/lx-source-personal
 */

//Alternate your API_LOC parameter below to your local server address, nginx autoindex preferred.
//Might need to fine tune paths

const DEV_ENABLE = false;
const API_URL = "http://127.0.0.1:9763";
const API_LOC = "http://127.0.0.1:8080";
const SOURCES = ["kw", "kg", "tx", "wy", "mg", "local"];

const { EVENT_NAMES, request, on, send, utils } = globalThis.lx;

const httpFetch = (url, options = { method: "GET" }) =>
  new Promise((resolve, reject) => {
    request(url, options, (err, resp) => {
      if (err) return reject(err);
      console.log("[HTTP] Response for", url, resp.body);
      resolve(resp);
    });
  });

const handleGetMusicUrl = async (source, musicInfo, quality) => {
  if (source === "local") {
    return `${API_LOC}/${encodeURIComponent(musicInfo.songmid)}`;
  }

  const songId = musicInfo.hash || musicInfo.copyrightId || musicInfo.songmid;

  if (source === "wy") {
    const songId = musicInfo.songmid || musicInfo.id;
    const body = `ids=%5B${songId}%5D&br=128000`;
    const { body: res } = await httpFetch(
      "https://music.163.com/api/song/enhance/player/url",
      {
        method: "POST",
        headers: {
          Cookie: `os=pc; _ntes_nuid=${[...Array(32)]
            .map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)])
            .join("")}`,
        },
        body,
      }
    );

    return res?.data?.[0]?.url || null;
  }

  if (source === "kw") {
    const url = `https://mobi.kuwo.cn/mobi.s?f=web&type=convert_url_with_sign&br=128kmp3&format=mp3&rid=${musicInfo.songmid}`;
    const { body } = await httpFetch(url, { method: "GET" });
    return body?.data?.url || null;
  }

  const id = source === "kg" ? musicInfo.hash : songId;
  const { body } = await httpFetch(
    `${API_URL}/url/${source}/${id}/${quality}`,
    {
      method: "GET",
      follow_max: 5,
    }
  );
  return !body || isNaN(+body.code) ? null : body.url;
};

const musicSources = Object.fromEntries(
  SOURCES.map((name) => [
    name,
    { name, type: "music", actions: ["musicUrl"], qualitys: ["128k"] },
  ])
);

on(EVENT_NAMES.request, async ({ action, source, info }) => {
  try {
    if (action !== "musicUrl") throw new Error("action not supported");
    const url = await handleGetMusicUrl(source, info.musicInfo, info.type);
    return url;
  } catch (err) {
    return Promise.reject(err.message || err);
  }
});

send(EVENT_NAMES.inited, {
  status: true,
  openDevTools: DEV_ENABLE,
  sources: musicSources,
});
