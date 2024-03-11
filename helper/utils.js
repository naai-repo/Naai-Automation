const { default: mongoose } = require("mongoose");
const Salon = require("../model/Salon");
const Service = require("../model/Service");
const Artist = require("../model/Artist");

const getSalonInfo = (phoneNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      let salon = await Salon.findOne({ phoneNumber: phoneNumber });
      if (!salon) {
        resolve({ salonId: null, discount: 0, salonLocation: null });
      }
      resolve({
        salonId: salon._id,
        discount: salon.discount,
        salonLocation: salon.location,
      });
    } catch (err) {
      reject(err);
    }
  });
};
const createNewService = (salonId, data, variableArr, discount) => {
  return new Promise(async (resolve, reject) => {
    try {
      let service = new Service({
        salonId: salonId,
        category: data.category.toLowerCase(),
        serviceTitle: data["service title"].toLowerCase(),
        targetGender: data["target gender"].toLowerCase(),
        variables: variableArr,
        description: data.description,
        avgTime: data["avg time"] / 30,
        cutPrice: Number(data["base price"]) || 0,
        basePrice:
          Number(data["base price"]) -
            (Number(data["base price"]) * discount) / 100 || 0,
      });
      let newData = await service.save();
      resolve(newData);
    } catch (err) {
      reject(err);
    }
  });
};

const findService = (salonId, data, timeout) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      try {
        let service = await Service.findOne({
          salonId: salonId,
          category: data.category.toLowerCase(),
          serviceTitle: data["service title"].toLowerCase(),
          targetGender: data["target gender"].toLowerCase(),
        });
        resolve(service);
      } catch (err) {
        reject(err);
      }
    }, timeout);
  });
};

const getCategoryMatch = (categories) => {
  categories = JSON.parse(categories);
  let categoryMatch = [];
  for (let category of categories) {
    categoryMatch.push({ category: category.toLowerCase() });
  }
  return categoryMatch;
};

const getGenderMatch = (gender) => {
  if (gender.toLowerCase() === "unisex") {
    return [
      { targetGender: "male" },
      { targetGender: "female" },
      { targetGender: "unisex" },
    ];
  } else if (gender.toLowerCase() === "men") {
    return [{ targetGender: "male" }];
  } else if (gender.toLowerCase() === "women") {
    return [{ targetGender: "female" }];
  }
};

const getArtistServices = (salonId, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let categoryMatch = getCategoryMatch(data["service category"]);
      let genderMatch = getGenderMatch(data["target gender"]);
      let services = await Service.aggregate([
        {
          $match: {
            salonId: salonId,
          },
        },
        {
          $match: {
            $or: categoryMatch,
          },
        },
        {
          $match: {
            $or: genderMatch,
          },
        },
      ]);
      resolve(services);
    } catch (err) {
      reject(err);
    }
  });
};

const addArtistServices = (services) => {
  return new Promise((resolve, reject) => {
    try {
      let artistServices = [];
      for (let service of services) {
        let obj = {
          serviceId: service._id,
          variables: [],
          price: service.cutPrice,
        };
        if (service.variables.length > 0) {
          obj.variables = service.variables.map((variable) => ({
            variableId: variable._id,
            price: variable.variableCutPrice,
          }));
        }
        artistServices.push(obj);
      }
      resolve(artistServices);
    } catch (err) {
      reject(err);
    }
  });
};

const findArtist = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let artist = await Artist.findOne({ phoneNumber: data["artist number"] });
      resolve(artist);
    } catch (err) {
      reject(err);
    }
  });
};

const getServicesForArtist = (services) => {
  return new Promise(async (resolve, reject) => {
    try {
      let serviceDataPromiseArr = [];
      for (let service of services) {
        let serviceData = Service.findOne({ _id: service.serviceId});
        serviceDataPromiseArr.push(serviceData);
      }
      let serviceDataArr = await Promise.all(serviceDataPromiseArr);
      console.log("Service DAta arr: ", serviceDataArr, serviceDataArr.length);
      let artistServices = [];
      for (let service of serviceDataArr) {
        let obj = {
          serviceId: service._id,
          variables: [],
          price: service.cutPrice,
        };
        if (service.variables.length > 0) {
          obj.variables = service.variables.map((variable) => ({
            variableId: variable._id,
            price: variable.variableCutPrice,
          }));
        }
        artistServices.push(obj);
      }
      resolve(artistServices);
    } catch (err) {
      reject(err);
    }
  });
}

class CommonUtils {
  static getDouble(value) {
    if (typeof value !== undefined) {
      return parseFloat(value.toString()).toFixed(2);
    }
  }
}

module.exports = {
  getSalonInfo,
  createNewService,
  findService,
  getArtistServices,
  addArtistServices,
  findArtist,
  getServicesForArtist
};
