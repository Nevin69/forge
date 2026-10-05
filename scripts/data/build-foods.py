"""Build the offline catalogue from the official USDA SR Legacy CSV download.
Usage: python3 scripts/data/build-foods.py /path/to/unzipped/csv-directory
No nutrition values are hand-authored. IDs, descriptions and measures remain traceable.
"""
import csv,json,sys,pathlib
p=pathlib.Path(sys.argv[1]);root=pathlib.Path(__file__).resolve().parents[2]
selected={
169756:('White rice · raw','Grains'),169757:('White rice · cooked, no salt','Grains'),168893:('Whole-wheat flour / atta · dry','Grains'),171844:('Roti / chapati · commercially prepared','Grains'),172688:('Whole-wheat bread','Grains'),173904:('Oats · dry, unfortified','Grains'),173905:('Oats · cooked in water, no salt','Grains'),172421:('Lentils / dal · boiled, no salt','Pulses'),173756:('Chickpeas / chana · dry','Pulses'),173757:('Chickpeas / chana · boiled, no salt','Pulses'),173744:('Rajma / red kidney beans · dry','Pulses'),175194:('Rajma / red kidney beans · boiled','Pulses'),174256:('Moong / mung beans · dry','Pulses'),174257:('Moong / mung beans · boiled','Pulses'),172436:('Toor / pigeon peas · dry','Pulses'),172437:('Toor / pigeon peas · boiled','Pulses'),173424:('Egg · hard-boiled','Eggs & meat'),171287:('Egg · raw','Eggs & meat'),172217:('Whole milk · unfortified','Dairy & soy'),171284:('Plain whole-milk yogurt / curd','Dairy & soy'),172475:('Firm tofu · calcium-set','Dairy & soy'),171477:('Chicken breast · roasted, skinless','Eggs & meat'),175176:('Tilapia fish · raw','Eggs & meat'),175177:('Tilapia fish · cooked, dry heat','Eggs & meat'),173944:('Banana · raw','Fruit'),171688:('Apple · raw, with skin','Fruit'),169097:('Orange · raw','Fruit'),169910:('Mango · raw','Fruit'),173044:('Guava · raw','Fruit'),168462:('Spinach / palak · raw','Vegetables'),170457:('Tomato · raw','Vegetables'),170000:('Onion · raw','Vegetables'),170026:('Potato · raw, skin on','Vegetables'),170393:('Carrot · raw','Vegetables'),169986:('Cauliflower / gobi · raw','Vegetables'),170419:('Green peas · raw','Vegetables'),170567:('Almonds','Nuts & seeds'),173806:('Peanuts · dry-roasted, unsalted','Nuts & seeds'),169414:('Flaxseed / alsi','Nuts & seeds'),170554:('Chia seeds · dried','Nuts & seeds'),172337:('Mustard oil','Oils & extras'),171025:('Sunflower oil · linoleic','Oils & extras'),173412:('Butter oil / ghee · anhydrous','Oils & extras'),173468:('Table salt','Oils & extras')}
keys={1008:'calories',1003:'protein',1005:'carbs',1004:'fat',1079:'fibre',1087:'calcium',1089:'iron',1090:'magnesium',1092:'potassium',1093:'sodium',1095:'zinc',1106:'vitaminA',1162:'vitaminC',1114:'vitaminD',1178:'vitaminB12',1190:'folate'}
foods={}
for row in csv.DictReader(open(p/'food.csv')):
 i=int(row['fdc_id'])
 if i in selected:
  name,cat=selected[i]
  foods[i]={'id':f'usda-{i}','name':name,'description':row['description'],'category':cat,'vegetarian':cat!='Eggs & meat','basis':100,'nutrients':{k:None for k in keys.values()},'source':f'USDA FoodData Central · SR Legacy 2018 · FDC {i}','sourceUrl':f'https://fdc.nal.usda.gov/food-details/{i}/nutrients','measures':[]}
for row in csv.DictReader(open(p/'food_nutrient.csv')):
 i,n=int(row['fdc_id']),int(row['nutrient_id'])
 if i in foods and n in keys and row['amount']!='':foods[i]['nutrients'][keys[n]]=float(row['amount'])
for row in csv.DictReader(open(p/'food_portion.csv')):
 i=int(row['fdc_id'])
 if i in foods and row['gram_weight'] and row['amount'] and row['modifier']:
  foods[i]['measures'].append({'name':row['amount']+' '+row['modifier'],'grams':float(row['gram_weight'])})
assert len(foods)==len(selected)
catalogue=list(foods.values())+[json.loads((root/'scripts/data/paneer-label.json').read_text())]
(root/'lib/nutrition/foods.json').write_text(json.dumps(catalogue,indent=2))
print('Generated',len(foods),'traceable foods')
