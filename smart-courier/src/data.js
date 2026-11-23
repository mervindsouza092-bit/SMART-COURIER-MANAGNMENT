const S=(n,cust,courier,from,to,pkg,price,status,eta,date)=>({id:'SC-2026-9482'+n,cust,courier,from,to,pkg,price,status,eta,date})
export const shipments=[
S(1,'Aarav Patil','Ravi K.','Virar West','Andheri East','Documents',249,'In Transit','24 min','19 Nov'),
S(2,'Priya Shah','Imran S.','Vasai Road','Bandra Kurla','Electronics',620,'Out for Delivery','9 min','19 Nov'),
S(3,'Rohan Mehta','Suresh P.','Nalasopara','Thane','Clothing',310,'Picked Up','58 min','19 Nov'),
S(4,'Sneha Joshi','Ravi K.','Borivali','Dadar','Books',180,'Delivered','–','18 Nov'),
S(5,'Vikram Rao','Anil D.','Mira Road','Powai','Food Box',150,'Pending','1 h 20 min','19 Nov'),
S(6,'Meera Nair','Imran S.','Bhayandar','Colaba','Fragile',890,'Cancelled','–','17 Nov')]
export const STAGES=['Order Created','Pickup Confirmed','Package Collected','In Transit','Out for Delivery','Delivered']
export const stageOf={Pending:1,'Picked Up':2,'In Transit':3,'Out for Delivery':4,Delivered:5,Cancelled:0}
export const couriers=[
{id:'CR-101',name:'Ravi Kumar',phone:'98200 11111',vehicle:'EV Van',loc:'Virar',active:3,perf:96,status:'On Delivery'},
{id:'CR-102',name:'Imran Shaikh',phone:'98200 22222',vehicle:'Bike',loc:'Vasai',active:2,perf:92,status:'On Delivery'},
{id:'CR-103',name:'Suresh Patil',phone:'98200 33333',vehicle:'EV Scooter',loc:'Nalasopara',active:0,perf:89,status:'Available'},
{id:'CR-104',name:'Anil Desai',phone:'98200 44444',vehicle:'Mini Truck',loc:'Mira Road',active:1,perf:94,status:'Online'},
{id:'CR-105',name:'Kiran More',phone:'98200 55555',vehicle:'Bike',loc:'Borivali',active:0,perf:81,status:'Offline'}]
export const growth={
'7D':['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=>({d,orders:[120,150,140,180,210,260,230][i],revenue:[18,22,21,27,32,40,35][i]})),
'30D':['W1','W2','W3','W4'].map((d,i)=>({d,orders:[820,960,1100,1280][i],revenue:[120,142,165,190][i]})),
'1Y':['Jan','Mar','May','Jul','Sep','Nov'].map((d,i)=>({d,orders:[2200,2800,3400,4100,4900,5600][i],revenue:[320,410,500,610,720,830][i]}))}

const U=(name,role,ships)=>({id:name.split(' ')[0].toLowerCase(),name,email:name.split(' ')[0].toLowerCase()+'@mail.com',phone:'98765 '+(10000+name.length*1111),role,ships})
export const users=[U('Aarav Patil','User',42),U('Priya Shah','User',31),U('Rohan Mehta','User',18),U('Sneha Joshi','User',27),U('Vikram Rao','User',9),U('Meera Nair','User',54),U('Ravi Kumar','Courier',210),U('Imran Shaikh','Courier',188),U('Suresh Patil','Courier',143),U('Anil Desai','Courier',97),U('Kiran More','Courier',61),U('Tanvi Kulkarni','User',12)]
