const datastore = require("nedb");

// uses nedb and this justs makes it esier by putting it into Promises
class Database {
  constructor(name) {
    this.database = new datastore(name + ".dat");
    this.database.loadDatabase();
  }

  checkProperty(property) {
    return new Promise((resolve, reject) => {
      this.database.findOne(property, (err, doc) => {
        if (err) reject(err);
        else if (doc != null) resolve({ found: true, doc: doc });
        else resolve({ found: false, doc: doc });
      });
    });
  }

  removeByProperty(property) {
    return new Promise((resolve, reject) => {
      this.database.remove(property, { multi: true }, (err, doc) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getCount() {
    return new Promise((resolve, reject) => {
      this.database.count({}, (err, count) => {
        if (err) reject(err);
        else resolve(count);
      });
    });
  }

  getAll(sort = {}) {
    return new Promise((resolve, reject) => {
      this.database
        .find({}, { _id: 0 })
        .sort(sort)
        .exec((err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
    });
  }

  insert(toInsert) {
    return new Promise((resolve, reject) => {
      this.database.insert(toInsert, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  update(query, theUpdate, options = {}) {
    return new Promise((resolve, reject) => {
      this.database.update(query, theUpdate, options, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
  }
}

module.exports = Database;
