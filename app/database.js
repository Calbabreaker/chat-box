const datastore = require("nedb");

class Database {
  constructor(name) {
    this.database = new datastore(name + ".dat");
    this.database.loadDatabase();
  }

  checkProperty(property) {
    return new Promise((resolve, reject) => {
      this.database.findOne(property, (err, doc) => {
        if (err) {
          reject(err);
        } else if (doc != null) {
          resolve({ status: "Found", doc: doc });
        } else {
          resolve({ status: "NotFound", doc: doc });
        }
      });
    });
  }

  removeByProperty(property) {
    return new Promise((resolve, reject) => {
      this.database.remove(property, { multi: true }, (err, doc) => {
        if (err) {
          reject(err);
        } else if (doc != null) {
          resolve({ status: "Sucess" });
        } else {
          resolve({ status: "Fail" });
        }
      });
    });
  }

  getCount() {
    return new Promise((resolve, reject) => {
      this.database.count({}, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
  }

  getAll(sort = {}) {
    this.database
      .find({}, { _id: 0 })
      .sort(sort)
      .exec((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
  }

  insert(toInsert) {
    return new Promise((resolve, reject) => {
      this.database.insert(toInsert, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = Database;
