const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const database = require('../database');


/**
 * 회원정보 생성 API
 * - 조건1. 중복이 아닌 아이디
 * - 조건2. 작성규칙을 준수하는 비밀번호
 */
router.post('/', (req, res) => {
  conn = database.init();
  console.log(req.body);
  const params = [
    req.body.id.toLowerCase(), // 소문자로 변환
    req.body.password,
    req.body.name,
    req.body.nickname,
    req.body.ageGroup,
    req.body.gender,
    req.body.question,
    req.body.answer
  ];

  // 컬럼값 저장형식 변환
  // 예. '20대' -> '20-29'
  let ageGroup = req.body.ageGroup;
  switch (ageGroup) {
    case '10대':
      ageGroup = '10-19';
      break;
    case '20대':
      ageGroup = '20-29';
      break;
    case '30대':
      ageGroup = '30-39';
      break;
    case '40대':
      ageGroup = '40-49';
      break;
    case '50대':
      ageGroup = '50-59';
      break;
    case '60대':
      ageGroup = '60+';
      break;
  }
  // 예. '남성' -> 'M'
  let gender = req.body.gender;
  if (gender) {
    gender = (gender === "남성") ? 'M' : 'W';
  }

  bcrypt.hash(params[1], 10, (err, hash) => {
    params[1] = hash;
    params[4] = ageGroup;
    params[5] = gender;
    conn.query('INSERT INTO user(`userid`,`password`,`name`,`nickname`,`age_group`,`gender`,`question`,`answer`) VALUES (?,?,?,?,?,?,?,?)'
        , params, (err, row) => {
      if (err) { console.log(err); }
      return res.status(201).json({
        // no: row['insertId'],
        userid: params[0],
        // password: params[1],
        name: params[2],
        nickname: params[3],
        ageGroup: params[4],
        gender: params[5]
      });
    });
    database.end(conn);
  });
})

/**
 * [GET] 회원정보 단건조회 API
 * [DEL] 회원정보 삭제 API
 */
router.route('/:id')
  .all((req, res, next) => {
    console.log(router.route);
    req.conn = database.init();
    next();
  })
  .get((req, res) => {
    console.log('get user from user router');
    const id = req.params.id;
    req.conn.query('SELECT userid, password, name, nickname, age_group, gender FROM user WHERE userid = ? AND is_deleted = "N"'
        , id, (err, row) => {
      if (err) { console.log(err); }
      if (user = row[0]) {
        return res.status(200).json({
          userid: user.userid,
          password: user.password,
          name: user.name,
          nickname: user.nickname,
          ageGroup: user.age_group,
          gender: user.gender
        });
      } else {
        return res.status(404).json({err: 'Unknown user'});
      }
      database.end(req.conn);
    });
  })
  .delete((req, res) => {
    //console.log('delete user from user router');
    const id = req.params.id;
    req.conn.query('UPDATE user SET is_deleted = "Y", deleted_date = CURRENT_TIMESTAMP WHERE userid = ?'
        , id, (err, row) => {
      if (err) { console.log(err); }
      return res.status(204).send();
    });
    database.end(req.conn);
  })

/**
 * 아이디 유효성 검사 API
 */
router.get('/checkId/:id', (req, res) => {
  const id = req.params.id;
  conn.query('SELECT id FROM user WHERE id = LOWER(?)', id, (err, row) => {
    if (err) { console.log(err); }
    let result = row[0] ? false : true;
    return res.status(200).json({result: result});
  })
  //database.end(conn);
});

module.exports = router;