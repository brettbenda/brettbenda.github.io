import json
import csv


##docs[set#][#]
docs = []

##item[set#][participant#][#]
logs = []
segments = []

path1 = "ProvSegments/Dataset_" #dataset num
path2 = "/User Interactions/"
path21 = "/Segmentation/"
path3 = "_P" #user num
path4 = "_InteractionsLogs.json"
path41 = "_20_4_6_Prov_Segments.csv"

def setToString(i):
    if (i==1):
        return "Arms"
    elif (i==2):
        return "Terrorist"
    else:
        return "Disappearance"

#Open doc JSON
with open('ProvSegments/Dataset_1/Documents/Documents_Dataset_1.json', encoding="utf8") as file:
    docs.append(json.load(file))
with open('ProvSegments/Dataset_2/Documents/Documents_Dataset_2.json', encoding="utf8") as file:
    docs.append(json.load(file))
with open('ProvSegments/Dataset_3/Documents/Documents_Dataset_3.json', encoding="utf8") as file:
    docs.append(json.load(file))

#Open log/segment JSON
for i in range (1,4):
    setlogs = []
    setsegments = []
    for j in range (1,9):
        with open(path1+str(i)+path2+setToString(i)+path3+str(j)+path4) as file:
            file_json = json.load(file)
            setlogs.append(file_json)

        with open(path1+str(i)+path21+setToString(i)+path3+str(j)+path41) as file:
            reader = csv.DictReader(file)
            csvjson = [json.dumps(d) for d in reader]
            setsegments.append(csvjson);

    logs.append(setlogs)
    segments.append(setsegments)

print(segments[0][1])

for _set in range(0,3):
    for _id in range(0,8):
        # print(_set, _id)
        for item in logs[_set][_id]:

            item.update({'dataset' : _set+1})
            item.update({'PID': _id+1})

            for segment in segments[_set][_id]:
                stringjson = json.loads(segment)
                if(item['time']/10 >= float(stringjson['start']) and item['time']/10 <= float(stringjson['end'])):
                    item.update({'segment' : int(stringjson['ID'])})



#with open('test.json', 'w') as json_file:
print(json.dumps(logs, indent=4))