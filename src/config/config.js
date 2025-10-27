export const poached = {
  jobCategoryList: [
    { name: 'Floor', code: 54 },
    { name: 'Bar', code: 51 },
    { name: 'Kitchen', code: 53 },
    { name: 'Management', code: 52 },
    { name: 'Barista', code: 16 },
    { name: 'Counter', code: 382 },
    { name: 'Hotel', code: 166 },
    { name: 'Distributor', code: 413 },
  ],
  api: {
    url: 'https://poachedjobs.com/api/v1/jobs?',
    defaultParams: {
      isLikelyFraud: false,
      status: 'publish',
    }
  },
};
