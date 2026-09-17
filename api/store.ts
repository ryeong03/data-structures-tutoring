import { AsyncLocalStorage } from 'node:async_hooks';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, DeleteCommand, TransactWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';

const client=DynamoDBDocumentClient.from(new DynamoDBClient({}),{marshallOptions:{removeUndefinedValues:true}});
const TableName=process.env.TABLE_NAME||'';
const activeWorkspace=new AsyncLocalStorage<string>();
export const DEFAULT_WORKSPACE='default';
export const workspaceId=()=>activeWorkspace.getStore()||DEFAULT_WORKSPACE;
export const withWorkspace=<T>(id:string,work:()=>Promise<T>)=>activeWorkspace.run(id,work);
export const physicalKey=(pk:string,id=workspaceId())=>id===DEFAULT_WORKSPACE?pk:`WS#${id}#${pk}`;
const logicalItem=(row:Item,id=workspaceId()):Item=>id===DEFAULT_WORKSPACE?row:{...row,pk:row.pk.slice(`WS#${id}#`.length)};
export type Item=Record<string,any> & {pk:string;sk:string};

export async function getGlobal(pk:string,sk='META'):Promise<Item|undefined>{
  return (await client.send(new GetCommand({TableName,Key:{pk,sk}}))).Item as Item|undefined;
}
export async function putGlobal(item:Item,ifAbsent=false):Promise<void>{
  await client.send(new PutCommand({TableName,Item:item,...(ifAbsent?{ConditionExpression:'attribute_not_exists(pk)'}:{})}));
}
export async function removeGlobal(pk:string,sk='META'):Promise<void>{await client.send(new DeleteCommand({TableName,Key:{pk,sk}}));}
export async function queryGlobal(pk:string):Promise<Item[]>{
  let next:Record<string,any>|undefined;const items:Item[]=[];
  do{
    const page=await client.send(new QueryCommand({TableName,KeyConditionExpression:'pk = :pk',ExpressionAttributeValues:{':pk':pk},ExclusiveStartKey:next}));
    items.push(...(page.Items||[]) as Item[]);next=page.LastEvaluatedKey;
  }while(next);
  return items;
}
export async function get(pk:string,sk='META'):Promise<Item|undefined>{
  const row=await getGlobal(physicalKey(pk),sk);
  return row&&logicalItem(row);
}
export async function put(item:Item,ifAbsent=false):Promise<void>{
  await putGlobal({...item,pk:physicalKey(item.pk)},ifAbsent);
}
export async function remove(pk:string,sk='META'):Promise<void>{await client.send(new DeleteCommand({TableName,Key:{pk:physicalKey(pk),sk}}));}
export async function joinWithCode(member:Item,codeHash:string):Promise<void>{
  await client.send(new TransactWriteCommand({TransactItems:[
    {ConditionCheck:{TableName,Key:{pk:physicalKey('INVITE#CURRENT'),sk:'META'},ConditionExpression:'#hash = :hash',ExpressionAttributeNames:{'#hash':'codeHash'},ExpressionAttributeValues:{':hash':codeHash}}},
    {Update:{TableName,Key:{pk:physicalKey('JOIN#COUNT'),sk:'META'},UpdateExpression:'SET #count = if_not_exists(#count, :zero) + :one',ConditionExpression:'attribute_not_exists(#count) OR #count < :limit',ExpressionAttributeNames:{'#count':'count'},ExpressionAttributeValues:{':zero':0,':one':1,':limit':5}}},
    {Put:{TableName,Item:{...member,pk:physicalKey(member.pk)},ConditionExpression:'attribute_not_exists(pk)'}},
    {Put:{TableName,Item:{pk:`ACCOUNT#${member.data.email}`,sk:`WS#${workspaceId()}`,data:{workspaceId:workspaceId()}}}}
  ]}));
}
export async function removeJoinedMember(email:string,memberId:string,affectedWeeks:Array<{id:number;report?:Item}>):Promise<void>{
  const transactions:any[]=[
    {Delete:{TableName,Key:{pk:physicalKey(`MEMBER#${email}`),sk:'META'},ConditionExpression:'#data.#id = :memberId',ExpressionAttributeNames:{'#data':'data','#id':'id'},ExpressionAttributeValues:{':memberId':memberId}}},
    {Delete:{TableName,Key:{pk:`ACCOUNT#${email}`,sk:`WS#${workspaceId()}`}}},
    {Update:{TableName,Key:{pk:physicalKey('JOIN#COUNT'),sk:'META'},UpdateExpression:'SET #count = #count - :one',ConditionExpression:'#count > :zero',ExpressionAttributeNames:{'#count':'count'},ExpressionAttributeValues:{':one':1,':zero':0}}}
  ];
  for(const week of affectedWeeks){
    transactions.push({Update:{TableName,Key:{pk:physicalKey(`WEEK#${week.id}`),sk:'META'},UpdateExpression:'REMOVE #data.#assignee',ConditionExpression:'#data.#assignee = :memberId',ExpressionAttributeNames:{'#data':'data','#assignee':'reportMemberId'},ExpressionAttributeValues:{':memberId':memberId}}});
    if(week.report){
      transactions.push({Put:{TableName,Item:{...week.report,pk:physicalKey(`REPORTARCHIVE#${week.id}#${randomUUID()}`)}}});
      transactions.push({Delete:{TableName,Key:{pk:physicalKey(`REPORT#${week.id}`),sk:'META'}}});
    }
  }
  await client.send(new TransactWriteCommand({TransactItems:transactions}));
}
export async function allGlobal():Promise<Item[]>{
  let next:Record<string,any>|undefined;const items:Item[]=[];
  do{
    const page=await client.send(new ScanCommand({TableName,ExclusiveStartKey:next}));
    items.push(...(page.Items||[]) as Item[]);next=page.LastEvaluatedKey;
  }while(next);
  return items;
}
export async function all():Promise<Item[]>{
  return rowsForWorkspace(await allGlobal(),workspaceId());
}
export function rowsForWorkspace(rows:Item[],id:string):Item[]{
  if(id===DEFAULT_WORKSPACE)return rows.filter(row=>!row.pk.startsWith('WS#')&&!row.pk.startsWith('WORKSPACE#')&&!row.pk.startsWith('ACCOUNT#'));
  const prefix=`WS#${id}#`;
  return rows.filter(row=>row.pk.startsWith(prefix)).map(row=>logicalItem(row,id));
}
