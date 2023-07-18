import {normalizeRequest,mapResDTO,applyResponse} from './modules/http-fetch.mjs';
import {addCorsHeaders} from './modules/cors-headers.mjs';
import fetch from 'node-fetch';
import{fileFetch,fileMap} from './modules/remote-files.mjs';

let hostTarget = 'www.google.com';
let hostList = [];
hostList.push('www.google.com');

export async function serverRequestResponse(reqDTO){
  
  let resDTO={};
  resDTO.headers={};
  let hostProxy = reqDTO.host;
  let path = reqDTO.shortURL.replaceAll('*', '');
  let pat = path.split('?')[0].split('#')[0];

  if (reqDTO.shortURL == '/ping') {
    resDTO.statusCode = 200;
    return resDTO;
  }
  if (pat == '/link-resolver.js') {
    let response = await fileFetch(pat);
    resDTO = mapResDTO(resDTO,response);
    return resDTO;

  }

  reqDTO.host = hostTarget;
  reqDTO.headers.host = hostTarget;
  reqDTO.headers.referer = hostTarget;

    /* fetch from your desired target */
    let response = await fetch('https://' + hostTarget + path,reqDTO);

    /* if there is a problem try redirecting to the original */
    if (response.status > 399) {
      resDTO.headers['location']='https://' + hostTarget + path;
      resDTO.statusCode = 302;
      return resDTO;
    }


    resDTO = mapResDTO(resDTO,response);

    
    /* check to see if the response is not a text format */
    let ct = response.headers.get('content-type');

  
    resDTO.headers['content-type'] = ct;
  

    
    if ((ct) && (!ct.includes('image')) && (!ct.includes('video')) && (!ct.includes('audio'))) {

      /* Copy over target response and return */
      let resBody = await response.text();
if(ct.includes('html')||ct.includes('xml')||pat.endsWith('.html')||pat.endsWith('.xhtml')){
      resBody = resBody.replace('<head>',
        `<head modified><script src=https://`+ hostProxy + `/link-resolver.js host-list=` + btoa(JSON.stringify(hostList)) + `></script>`);
    }
      
      resDTO.body = resBody;
      return resDTO;


    } else {
      
      let resBody = Buffer.from(await response.arrayBuffer());
      resDTO.body = resBody;
      return resDTO;

    }
  


}