export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const checkedAt=new Date().toISOString();
  const payload={
    ok:true,
    service:'tradinglab-macro-terminal',
    checkedAt,
    version:'runtime-guard-v1'
  };
  return res.status(200).json(payload);
}
