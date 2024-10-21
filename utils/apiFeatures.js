//Builder Patterns

class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  //doSorting, prefix "-" will doing sort descending
  sort() {
    //doSorting, prefix "-" will doing sort descending
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      //we got problem when you try paginate, it giving a weird result sometimes a name appear twice in diff page!
      //note : this is intended in mongoose because your createdAt can be same value, so add more ties to sorting to solve this
      this.query = this.query.sort('-createdAt _id');
    }
    return this;
  }

  //field limiting
  limitFields() {
    if (this.queryString.fields) {
      const fieldList = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fieldList);
    } else {
      //removing field "__v" using prefixes "-"
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const pageResult = this.queryString.page * 1 || 1;
    const limitResult = this.queryString.limit * 1 || 100;
    const skip = (pageResult - 1) * limitResult;
    // console.log(skip, 'skip', limitResult, 'limitresult');
    this.query = this.query.skip(skip).limit(limitResult);

    return this;
  }
}

module.exports = ApiFeatures;
