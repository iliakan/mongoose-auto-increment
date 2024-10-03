let async = require('async'),
should = require('chai').should(),
mongoose = require('mongoose'),
autoIncrement = require('..'),
connection;

// mongoose.set('debug', true);

before(function (done) {
  connection = mongoose.createConnection('mongodb://127.0.0.1/mongoose-auto-increment-test');
  connection.on('error', console.error.bind(console));
  connection.once('open', function () {
    autoIncrement.initialize(connection);
    done();
  });
});

after(async function() {
  await connection.dropDatabase();
  connection.close();
});

afterEach(function (done) {
  connection.model('User').collection.drop(function () {
    delete connection.models.User;
    connection.model('IdentityCounter').collection.drop(done);
  });
});

describe('mongoose-auto-increment', function () {

  it('should increment the _id field on save', async function () {

    // Arrange
    let userSchema = new mongoose.Schema({
      name: String,
      dept: String
    });
    userSchema.plugin(autoIncrement.plugin, 'User');

    let User = connection.model('User', userSchema),
    user1 = new User({ name: 'Charlie', dept: 'Support' }),
    user2 = new User({ name: 'Charlene', dept: 'Marketing' });

    await user1.save();
    await user2.save();

    user1.should.have.property('_id', 0);
    user2.should.have.property('_id', 1);

  });

  it('should increment the specified field instead (Test 2)', async function() {

    // Arrange
    let userSchema = new mongoose.Schema({
      name: String,
      dept: String
    });
    userSchema.plugin(autoIncrement.plugin, { model: 'User', field: 'userId' });
    let User = connection.model('User', userSchema),
    user1 = new User({ name: 'Charlie', dept: 'Support' }),
    user2 = new User({ name: 'Charlene', dept: 'Marketing' });

    await user1.save();
    await user2.save();

    user1.should.have.property('userId', 0);
    user2.should.have.property('userId', 1);

  });


  it('should start counting at specified number (Test 3)', async function() {

    // Arrange
    let userSchema = new mongoose.Schema({
      name: String,
      dept: String
    });
    userSchema.plugin(autoIncrement.plugin, { model: 'User', startAt: 3 });
    let User = connection.model('User', userSchema),
    user1 = new User({ name: 'Charlie', dept: 'Support' }),
    user2 = new User({ name: 'Charlene', dept: 'Marketing' });

    await user1.save();
    await user2.save();

    user1.should.have.property('_id', 3);
    user2.should.have.property('_id', 4);

  });

  it('should increment by the specified amount (Test 4)', async function () {

    // Arrange
    let userSchema = new mongoose.Schema({
      name: String,
      dept: String
    });

    userSchema.plugin(autoIncrement.plugin, { model: 'User', incrementBy: 5 });
    let User = connection.model('User', userSchema),
    user1 = new User({ name: 'Charlie', dept: 'Support' }),
    user2 = new User({ name: 'Charlene', dept: 'Marketing' });

    await user1.save();
    await user2.save();

    user1.should.have.property('_id', 0);
    user2.should.have.property('_id', 5);

  });


  describe('helper function', function () {

    it('nextCount should return the next count for the model and field (Test 5)', async function() {

      // Arrange
      let userSchema = new mongoose.Schema({
        name: String,
        dept: String
      });
      userSchema.plugin(autoIncrement.plugin, 'User');
      let User = connection.model('User', userSchema),
      user1 = new User({ name: 'Charlie', dept: 'Support' }),
      user2 = new User({ name: 'Charlene', dept: 'Marketing' });;

      let results = {};
      results.count1 = await user1.nextCount();
      results.user1 = await user1.save();
      results.count2 = await user1.nextCount();
      results.user2 = await user2.save();
      results.count3 = await user2.nextCount();

      results.count1.should.equal(0);
      results.user1.should.have.property('_id', 0);
      results.count2.should.equal(1);
      results.user2.should.have.property('_id', 1);
      results.count3.should.equal(2);

    });

    it('resetCount should cause the count to reset as if there were no documents yet.', async function() {

      // Arrange
      let userSchema = new mongoose.Schema({
        name: String,
        dept: String
      });
      userSchema.plugin(autoIncrement.plugin, 'User');
      let User = connection.model('User', userSchema),
      user = new User({name: 'Charlie', dept: 'Support'});

      let results = {};
      results.user = await user.save();
      results.count1 = await user.nextCount();
      results.reset = await user.resetCount();
      results.count2 = await user.nextCount();

      results.user.should.have.property('_id', 0);
      results.count1.should.equal(1);
      results.reset.should.equal(0);
      results.count2.should.equal(0);

    });

  });
});
