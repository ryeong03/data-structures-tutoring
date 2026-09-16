import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, DeleteCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';

const client=DynamoDBDocumentClient.from(new DynamoDBClient({}),{marshallOptions:{removeUndefinedValues:true}});
const TableName=process.env.TABLE_NAME||'';
export type Item=Record<string,any> & {pk:string;sk:string};
export async function get(pk:string,sk='META'):Promise<Item|undefined>{
  return (await client.send(new GetCommand({TableName,Key:{pk,sk}}))).Item as Item|undefined;
}
export async function put(item:Item,ifAbsent=false):Promise<void>{
  await client.send(new PutCommand({TableName,Item:item,...(ifAbsent?{ConditionExpression:'attribute_not_exists(pk)'}:{})}));
}
export async function remove(pk:string,sk='META'):Promise<void>{await client.send(new DeleteCommand({TableName,Key:{pk,sk}}));}
export async function joinWithCode(member:Item,codeHash:string):Promise<void>{
  await client.send(new TransactWriteCommand({TransactItems:[
    {ConditionCheck:{TableName,Key:{pk:'INVITE#CURRENT',sk:'META'},ConditionExpression:'#hash = :hash',ExpressionAttributeNames:{'#hash':'codeHash'},ExpressionAttributeValues:{':hash':codeHash}}},
    {Update:{TableName,Key:{pk:'JOIN#COUNT',sk:'META'},UpdateExpression:'SET #count = if_not_exists(#count, :zero) + :one',ConditionExpression:'attribute_not_exists(#count) OR #count < :limit',ExpressionAttributeNames:{'#count':'count'},ExpressionAttributeValues:{':zero':0,':one':1,':limit':5}}},
    {Put:{TableName,Item:member,ConditionExpression:'attribute_not_exists(pk)'}}
  ]}));
}
export async function removeJoinedMember(email:string,memberId:string,affectedWeeks:Array<{id:number;report?:Item}>):Promise<void>{
  const transactions:any[]=[
    {Delete:{TableName,Key:{pk:`MEMBER#${email}`,sk:'META'},ConditionExpression:'#data.#id = :memberId',ExpressionAttributeNames:{'#data':'data','#id':'id'},ExpressionAttributeValues:{':memberId':memberId}}},
    {Update:{TableName,Key:{pk:'JOIN#COUNT',sk:'META'},UpdateExpression:'SET #count = #count - :one',ConditionExpression:'#count > :zero',ExpressionAttributeNames:{'#count':'count'},ExpressionAttributeValues:{':one':1,':zero':0}}}
  ];
  for(const week of affectedWeeks){
    transactions.push({Update:{TableName,Key:{pk:`WEEK#${week.id}`,sk:'META'},UpdateExpression:'REMOVE #data.#assignee',ConditionExpression:'#data.#assignee = :memberId',ExpressionAttributeNames:{'#data':'data','#assignee':'reportMemberId'},ExpressionAttributeValues:{':memberId':memberId}}});
    if(week.report){
      transactions.push({Put:{TableName,Item:{...week.report,pk:`REPORTARCHIVE#${week.id}#${randomUUID()}`}}});
      transactions.push({Delete:{TableName,Key:{pk:`REPORT#${week.id}`,sk:'META'}}});
    }
  }
  await client.send(new TransactWriteCommand({TransactItems:transactions}));
}
export async function all():Promise<Item[]>{
  let next:Record<string,any>|undefined;const items:Item[]=[];
  do{
    const page=await client.send(new ScanCommand({TableName,ExclusiveStartKey:next}));
    items.push(...(page.Items||[]) as Item[]);next=page.LastEvaluatedKey;
  }while(next);
  return items;
}
