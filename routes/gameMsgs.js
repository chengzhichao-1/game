var express = require('express');
var router = express.Router();
var models = require('../models');
const sequelize= require("sequelize");
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//新增/更新数据
router.post('/', async function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','*');
    const {usernamedata,level,scoredata,timedata} = req.body;
    console.log(usernamedata);
    if(usernamedata == "") return res.send({msg:'请登陆后游戏数据才能记录!',resultCode:300});

    const model1 = await models.GameUser.findOne({where:{username:usernamedata}})
    
    const model2 = await models.GameMsg.findOne({where:{userId:model1.id,level}})
    if(model2){
        if(scoredata>model2.score) model2.update({userId:model1.id,level,score:scoredata,time:timedata});
        else if(scoredata==model2.score && timedata<model2.time){
            model2.update({userId:model1.id,level,score:scoredata,time:timedata});
        }
        // res.json({model2: model2});
        return res.send({msg:'更新成功!',resultCode:200})
    }else{
        var gameMsgs = await models.GameMsg.create({userId:model1.id,level,score:scoredata,time:timedata});
        // res.json({gameMsgs: gameMsgs})
        return res.send({msg:'新增成功!',resultCode:200})    
    }
    
});

//查询自己的游戏记录
router.post('/rank/user', async function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','*');
    const {username} = req.body;

    const model1 = await models.GameUser.findOne({where:{username:username}});

    const model2 = await models.GameMsg.findAll({
        where:{userId:model1.id},
        order: [['level', 'ASC']],
    });
    
    return res.json({model2: model2})
});

//查询前八的记录
    router.get('/rank', async function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin','*');
        res.setHeader('Access-Control-Allow-Headers','*');
        //表进行关联
        models.GameMsg.belongsTo(models.GameUser, {
            foreignKey: 'userId',
            targetKey: 'id',
        });

        const model3 = await models.GameMsg.findAll({
            group: 'userId',
            attributes:[
                [sequelize.fn('SUM', sequelize.col('score')), 'sum_score'],
                [sequelize.fn('SUM', sequelize.col('time')), 'sum_time']
            ],
            include: [
                {
                    attributes: ['username'],
                    model: models.GameUser
                }
            ],
            // order: [['sum_score', 'DESC'],['sum_time']],
        });
        //对表按照key1字段降序，当key1字段相同时，key2字段升序排序
        function sortByKey(array, key1, key2) {
            return array.sort(function(a, b) {
                var x = Number(a.get(key1)); var y = Number(b.get(key1));
                // console.log(x+";"+y)
                return ((x > y) ? -1 : ((x < y) ? 1 : (a.get(key2) < b.get(key2) ? -1: 1)));
            
            });
        }
        const model4 = sortByKey(model3, 'sum_score','sum_time');

        return res.json({model4: model4});

    });

module.exports = router;
