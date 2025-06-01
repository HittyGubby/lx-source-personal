# Vanced LX-Source
- Modded lx-source js, and got local music files strean automatically across devices, hooray!

    You need to set a nginx autoindex or webdav server on the host that stored musics    

Basically just set the server on the device which to store your musics, and reroute requests for local files to the server, yep a minor one, but here just for convenience!

### (You need to alternate the API_LOC param in the js script)

3 outta 5 mainline CHN music platforms are ezily cracked: kw, wy and mg (kuwo, ncm, migu) (i mean cracked representing using no local apis but fetch from script directly)

but tx (qq music) and kg (kugou) still yet to be done, mainly because they used encryption and hashing algs that cannot be handled on sideloaded js api(no require(),import or \<script\>), so be it...

theoretically i can make another project to include all the cryptography algs and compile them into a minified js, but thats against my principles about code concising(lazy idk)

the main considerations is the globalThis.lx function sideload compability warning, im afraid compiler could mess that up

so to conclude: platform api viability rank:

1. kw - straight and direct api captured from relic mobile api, ez, 5/100

2. mg - newer apis that are at least updating so long, but still ez to capture and analyze, maybe they thought cors can block 3rd party uses? 30/100

3. wy - actually even easier than kw but cors and header handling puts thorns on the way 50/100

4. tx - hmm.. well tbh, forcing to require user login crendentials is disgusting, and there seemingly is no way around (referred to some api projects and theirs worked out well, idk how they do that) 80/100

5. kg - good luck coding the 3 layered custom crypto in javascript! enjoy yourselves and im gotta evacuate--- 150/100

Star me if this helped you! uwu~

(tbh i should fork the original source but its not a dedicated repo for that, so be it..)
