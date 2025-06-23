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
const API_LOC = "http://127.0.0.1:8080";
const API_NCM_FALLBACK = "https://neteasecloudmusicapi.vercel.app";
const SOURCES = ["kw", "kg", "tx", "wy", "mg", "local"];

const { EVENT_NAMES, request, on, send, utils } = globalThis.lx;

const httpFetch = (url, options = { method: "GET" }) =>
  new Promise((resolve, reject) => {
    request(url, options, (err, resp) => {
      if (err) {
        console.log(`Error: ${url}\n${err}`);
        return reject(err);
      }
      console.log(`Response: ${url}\n${JSON.stringify(resp.body)}`);
      resolve(resp);
    });
  });

const handleGetMusicUrl = async (source, musicInfo, quality) => {
  if (source === "local") {
    return `${API_LOC}/${encodeURIComponent(musicInfo.songmid)}`;
  }

  const songId = musicInfo.hash || musicInfo.songmid;

  if (source === "wy") {
    const { body: res } = await httpFetch(
      "https://music.163.com/api/song/enhance/player/url",
      {
        credentials: "include",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/x-www-form-urlencoded",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
        referrer: "https://music.163.com/",
        body: `ids=%5B${musicInfo.songmid}%5D&br=128000`,
        method: "POST",
        mode: "cors",
      }
    );
    const url = res?.data?.[0]?.url || null;
    if (url === null) {
      const request = await httpFetch(
        `${API_NCM_FALLBACK}/song/url/v1?id=${songId}&level=standard`,
        { method: "GET" }
      );
      const { body } = request;
      url = body.data[0].url;
    }
    return url;
  }

  if (source === "kw") {
    const url = `https://mobi.kuwo.cn/mobi.s?f=web&type=convert_url_with_sign&br=128kmp3&format=mp3&rid=${musicInfo.songmid}`;
    const { body } = await httpFetch(url);
    return body?.data?.url || null;
  }

  if (source === "mg") {
    const url = `https://app.c.nf.migu.cn/MIGUM3.0/strategy/pc/listen/v1.0?songId=${musicInfo.songmid}&resourceType=2&toneFlag=PQ`;
    const { body } = await httpFetch(url, { headers: { channel: "014X032" } });
    return body?.data?.url || null;
  }

  if (source === "tx") {
    const html = await httpFetch(
      `https://i.y.qq.com/v8/playsong.html?songmid=${musicInfo.songmid}`
    ).then((res) => res.text());
    return html.match(/"url":\s*"([^"]+)"/)[1].replace(/\\u002F/g, "/");
  }

  if (source === "kg") {
    const html = await httpFetch(
      `https://m.kugou.com/mixsong/${musicInfo.songmid}.html`
    ).then((res) => res.text());
    return html.match(/"url":"([^"]+)"/)[1].replace(/\\\//g, "/");
  }
  return null;
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
