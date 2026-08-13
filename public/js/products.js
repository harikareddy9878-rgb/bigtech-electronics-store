export const products = [
  { id:"BT-PH-101", name:"Nova X5 5G Smartphone", category:"Phones", price:24999, mrp:29999, rating:4.5, stock:8, badge:"X5" },
  { id:"BT-PH-102", name:"Pixelia A2 Camera Phone", category:"Phones", price:18999, mrp:21999, rating:4.3, stock:3, badge:"A2" },
  { id:"BT-PH-103", name:"Orion Fold Mini", category:"Phones", price:64999, mrp:72999, rating:4.4, stock:1, badge:"FOLD" },
  { id:"BT-PH-104", name:"Astra Lite 5G", category:"Phones", price:13999, mrp:16999, rating:4.2, stock:0, badge:"5G" },
  { id:"BT-LP-201", name:"AeroBook 14 Ryzen Laptop", category:"Laptops", price:52990, mrp:61990, rating:4.6, stock:6, badge:"14”" },
  { id:"BT-LP-202", name:"CorePro 15 Work Laptop", category:"Laptops", price:67990, mrp:74990, rating:4.5, stock:4, badge:"PRO" },
  { id:"BT-LP-203", name:"Feather Air Student Laptop", category:"Laptops", price:38990, mrp:44990, rating:4.1, stock:9, badge:"AIR" },
  { id:"BT-LP-204", name:"Creator 16 OLED Laptop", category:"Laptops", price:92990, mrp:105990, rating:4.7, stock:2, badge:"OLED" },
  { id:"BT-TV-301", name:"Vista 43 inch 4K Smart TV", category:"Televisions", price:29990, mrp:42990, rating:4.4, stock:7, badge:"4K" },
  { id:"BT-TV-302", name:"CineMax 55 inch QLED TV", category:"Televisions", price:57990, mrp:72990, rating:4.6, stock:2, badge:"QLED" },
  { id:"BT-TV-303", name:"RoomView 32 inch HD TV", category:"Televisions", price:13990, mrp:18990, rating:4.1, stock:10, badge:"HD" },
  { id:"BT-TV-304", name:"Theatre 65 inch Mini LED TV", category:"Televisions", price:98990, mrp:119990, rating:4.7, stock:1, badge:"65”" },
  { id:"BT-AU-401", name:"Pulse ANC Wireless Headphones", category:"Audio", price:6999, mrp:8999, rating:4.5, stock:12, badge:"ANC" },
  { id:"BT-AU-402", name:"BeatPods Pro Earbuds", category:"Audio", price:3999, mrp:5499, rating:4.3, stock:15, badge:"PRO" },
  { id:"BT-AU-403", name:"HomeSound 120W Soundbar", category:"Audio", price:9999, mrp:12999, rating:4.4, stock:5, badge:"120W" },
  { id:"BT-AU-404", name:"PocketBoom Bluetooth Speaker", category:"Audio", price:2499, mrp:3299, rating:4.2, stock:0, badge:"BOOM" },
  { id:"BT-AP-501", name:"FreshCare 260L Refrigerator", category:"Appliances", price:28990, mrp:34990, rating:4.4, stock:4, badge:"260L" },
  { id:"BT-AP-502", name:"CleanWave 8kg Washing Machine", category:"Appliances", price:25990, mrp:31990, rating:4.5, stock:3, badge:"8KG" },
  { id:"BT-AP-503", name:"CoolBreeze 1.5 Ton Inverter AC", category:"Appliances", price:37990, mrp:46990, rating:4.3, stock:2, badge:"AC" },
  { id:"BT-AP-504", name:"QuickChef 28L Microwave Oven", category:"Appliances", price:12990, mrp:15990, rating:4.2, stock:6, badge:"28L" }
];

export const categories = ["All", ...new Set(products.map(product => product.category))];

