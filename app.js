const mongoose = require("mongoose");
const csv = require("csv-parser");
const fs = require("fs");
const Salon = require("./model/Salon");
const Artist = require("./model/Artist");
const {
  createNewService,
  findService,
  getArtistServices,
  addArtistServices,
  getSalonInfo,
  findArtist,
  getServicesForArtist,
  checkIfDuplicate,
} = require("./helper/utils");
const Service = require("./model/Service");

let rows = [];
// Parsing the Data from salon.csv and saving to database
const addSalonData = () => {
  return new Promise((resolve, reject) => {
    let salonId = "";
    let salonName = "";
    fs.createReadStream("salon.csv")
      .pipe(csv({}))
      .on("data", async (data) => {
        let time = JSON.parse(data.timing);
        let location = JSON.parse(data.location);
        let tempData = new Salon({
          address: data.address,
          location: {
            type: "Point",
            coordinates: location.reverse(),
          },
          name: data.name,
          salonType: data["salon type"],
          phoneNumber: data["phone number"],
          timing: {
            closing: time[1],
            opening: time[0],
          },
          discount: data.discount,
          closedOn: data["closed on"] === "" ? "none" : data["closed on"],
          rating: Number(data.rating),
          live: data.live === "TRUE",
          paid: data.paid === "TRUE",
          owner: data.owner,
        });
        salonId = tempData._id;
        salonName = tempData.name;
        data._id = tempData._id;
        let temp = await tempData.save();
        console.log(tempData);
      })
      .on("end", () => {
        resolve({
          id: salonId,
          name: salonName,
        });
      });
  });
};

// Parsing the Data from service.csv and saving to database
const createServiceRecord = async () => {
  for (let data of rows) {
    let { salonId, discount } = await getSalonInfo(data["salon id"]);
    let variablesArr = [];
    let isDuplicate = await checkIfDuplicate(data);
    if (isDuplicate) {
      console.log("Duplicate Found!", data);
      continue;
    }

    if (salonId) {
      if (data.variables !== "") {
        let service = await findService(salonId, data, 1000);
        // console.log(service);
        let variable = {
          variableType: data["variable type"].toLowerCase(),
          variableName: data.variables.toLowerCase(),
          variableCutPrice: Number(data["base price"]) || 0,
          variablePrice:
            Number(data["base price"]) -
              Number(data["base price"] * discount) / 100 || 0,
          variableTime: data["avg time"] / 30 || 1,
        };
        if (!service) {
          variablesArr = [variable];
          let newService = await createNewService(
            salonId,
            data,
            variablesArr,
            discount
          );
          console.log(newService);
        } else {
          variablesArr = service.variables;
          variablesArr = variablesArr.filter(e => e.variableName !== variable.variableName);
          variablesArr.push(variable);
          service.variables = variablesArr;
          service.avgTime = data["avg time"] / 30;
          service.cutPrice = Number(data["base price"]) || 0;
          service.basePrice = Number(data["base price"]) - (Number(data["base price"]) * discount) / 100 || 0;
          let newService = await service.save();
          console.log(newService);
        }
      } else {
        let service = await findService(salonId, data, 1000);
        if(!service){
          let newService = await createNewService(
            salonId,
            data,
            variablesArr,
            discount
          );
          console.log(newService);
        }else{
          service.avgTime = data["avg time"] / 30;
          service.cutPrice = Number(data["base price"]) || 0;
          service.basePrice = Number(data["base price"]) - (Number(data["base price"]) * discount) / 100 || 0;
          let newService = await service.save();
          console.log(newService);
        }

      }
    } else {
      console.log("salon Not Found!");
    }
  }
  console.log("Services Finished !");
};

const addServiceData = () => {
  fs.createReadStream("service.csv")
    .pipe(csv({}))
    .on("data", async (data) => {
      if (data["base price"] !== "") {
        rows.push(data);
      }
    })
    .on("end", () => {
      createServiceRecord();
    });
};

// Parsing the Data from artists.csv and saving to database

const addArtistData = async () => {
  fs.createReadStream("artist.csv")
    .pipe(csv({}))
    .on("data", async (data) => {
      let { salonId, salonLocation } = await getSalonInfo(data["salon id"]);
      if (salonId) {
        let services = await getArtistServices(salonId, data);
        let artistServices = await addArtistServices(services);
        let artist = await findArtist(data);
        if (!artist) {
          let offDay = [];
          if (data["off day"]) {
            offDay = JSON.parse(data["off day"]);
          }
          let gender = "unisex";
          if (data["target gender"].toLowerCase() === "men") {
            gender = "male";
          } else if (data["target gender"].toLowerCase() === "women") {
            gender = "female";
          }
          let artistData = new Artist({
            name: data.name.toLowerCase(),
            salonId: salonId,
            phoneNumber: data["artist number"],
            timing: {
              start: JSON.parse(data.timing)[0],
              end: JSON.parse(data.timing)[1],
            },
            offDay: offDay,
            live: data.live.toLowerCase() === "true" ? true : false,
            rating: Number(data.rating),
            targetGender: gender,
            links: {
              instagram: data.links,
            },
            paid: data["marketing paid"] === "true" ? true : false,
            availability:
              data.availability.toLowerCase() === "true" ? true : false,
            location: salonLocation,
            services: artistServices,
          });
          let temp = await artistData.save();
          console.log(temp);
        } else {
          let offDay = [];
          if (data["off day"]) {
            offDay = JSON.parse(data["off day"]);
          }
          let gender = "unisex";
          if (data["target gender"].toLowerCase() === "men") {
            gender = "male";
          } else if (data["target gender"].toLowerCase() === "women") {
            gender = "female";
          }
          artist.name = data.name.toLowerCase();
          artist.salonId = salonId;
          artist.timing = {
            start: JSON.parse(data.timing)[0],
            end: JSON.parse(data.timing)[1],
          };
          artist.offDay = offDay;
          artist.live = data.live.toLowerCase() === "true" ? true : false;
          artist.rating= Number(data.rating);
          artist.targetGender= gender;
          artist.links= {
              instagram: data.links,
            };
          artist.paid = data["marketing paid"] === "true" ? true : false;
          artist.availability = data.availability.toLowerCase() === "true" ? true : false;
          artist.location = salonLocation;
          artist.services = artistServices;
          let temp = await artist.save();
          console.log(temp);
        }
      }
    })
    .on("end", () => {
      console.log("Artists finished !");
    });
};

const deleteServiceRecord = async () => {
  for (let data of rows) {
    let { salonId } = await getSalonInfo(data["salon id"]);
    if (salonId) {
      let service = await findService(salonId, data, 1000);
      if (!service) {
        continue;
      }
      let artists = await Artist.find({
        services: { $elemMatch: { serviceId: service._id.toString() } },
      });
      for (let artist of artists) {
        artist.services = artist.services.filter(
          (ele) => ele.serviceId !== service._id.toString()
        );
        let temp = await artist.save();
        console.log(temp);
      }
      let deletedService = await Service.deleteOne({ _id: service._id });
      console.log(deletedService);
    } else {
      console.log("salon Not Found!");
    }
  }
  console.log("Services Finished !");
  rows.length = 0;
};

const removeServiceData = () => {
  fs.createReadStream("deleteServices.csv")
    .pipe(csv({}))
    .on("data", async (data) => {
      if (data["base price"] !== "") {
        rows.push(data);
      }
    })
    .on("end", () => {
      deleteServiceRecord();
    });
};

// const correctArtistData = async () => {
//   try {
//     let artists = await Artist.find({});
//     // let saveArtistsPromiseArr = [];
//     let i=1;
//     for (let artist of artists) {
//       let artistService = await getServicesForArtist(artist.services);
//       artist.services = artistService;
//       await artist.save();
//       console.log(artist.name, " Saved !", i++);
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

const findMinValForServices = async () => {
  try {
    let services = await Service.find({});
    let saveServicePromiseArr = [];
    for (let service of services) {
      if (service.variables.length === 0) {
        continue;
      }
      let minBasePrice = service.variables.reduce((prev, next) =>
        prev.variablePrice < next.variablePrice ? prev : next
      );
      let minCutPrice = service.variables.reduce((prev, next) =>
        prev.variableCutPrice < next.variableCutPrice ? prev : next
      );
      let minTime = service.variables.reduce((prev, next) =>
        prev.variableTime < next.variableTime ? prev : next
      );
      service.basePrice = minBasePrice.variablePrice;
      service.cutPrice = minCutPrice.variableCutPrice;
      service.avgTime = minTime.variableTime;
      saveServicePromiseArr.push(service.save());
    }
    await Promise.all(saveServicePromiseArr);
    console.log("All Services Updated !");
  } catch (err) {
    console.log(err);
  }
};
let dbUrl = "mongodb+srv://naaiadmn:naaiadmn@cluster0.rg1ncj1.mongodb.net/naai";
// Connecting to MongoDB
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to Database!");

    // addSalonData();
    addServiceData();
    // addArtistData();
    // removeServiceData();
    // correctArtistData();
    // findMinValForServices();
  })
  .catch((err) => {
    console.log(err);
  });
