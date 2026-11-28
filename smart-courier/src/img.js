export const shrink=(file,max=1280,q=.8)=>new Promise((res,rej)=>{
  const im=new Image()
  im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',q))}
  im.onerror=()=>rej(new Error('Could not read this image'));im.src=URL.createObjectURL(file)
})
