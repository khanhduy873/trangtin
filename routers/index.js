var express = require('express');
var router = express.Router();
var firstImage = require('../modules/firstimage');
var ChuDe = require('../models/chude');
var BaiViet = require('../models/baiviet');
var User = require('../models/taikhoan');
var fetch = require('node-fetch');


//  API key từ RapidAPI 
const apiKey = '5f7801ccfdmshda3413a3b93c0b8p1140f3jsn6cbc5e974951';


// GET: Hiển thị tin mới nhất của mỗi chủ đề
router.get('/', async (req, res) => {
	try {
		var cd = await ChuDe.find();
		var bv = await BaiViet.find({ KiemDuyet: 1 })
			.populate('ChuDe')
			.populate('TaiKhoan')
			.sort({ NgayDang: -1 }) // giảm dần
			.exec();

		// Lấy tin mới nhất của mỗi chủ đề
		var baiviets = [];
		for (var chude of cd) {
			var bvChude = await BaiViet.findOne({ ChuDe: chude._id, KiemDuyet: 1 })
				.sort({ NgayDang: -1 })
				.populate('ChuDe')
				.populate('TaiKhoan')
				.exec();
			if (bvChude) {
				baiviets.push(bvChude);
			}
		}

		//Lấy thông tin thời tiết
		const city = 'LongXuyen'; // Thay đổi tên thành phố nếu cần
		const url = `https://yahoo-weather5.p.rapidapi.com/weather?location=${city}&format=json&u=c`;

		const options = {
			method: 'GET',
			headers: {
				'X-RapidAPI-Key': apiKey,
				'X-RapidAPI-Host': 'yahoo-weather5.p.rapidapi.com'
			}
		};


		const response = await fetch(url, options);
		const weather = await response.json();

		// Lấy 4 tin có lượt xem nhiều nhất
		var luotxem = await BaiViet.find({ KiemDuyet: 1 })
			.sort({ LuotXem: -1 }) // giảm
			.limit(4)
			.populate('ChuDe')
			.populate('TaiKhoan')
			.exec();

		res.render('home', {
			title: 'Trang chủ',
			chude: cd,
			baiviets: baiviets,
			baiviet: bv,
			luotxem: luotxem,
			firstImage: firstImage,
			weather: weather
		});
	} catch (err) {
		console.error(err);
		res.status(500).send('Có lỗi xảy ra');
	}
});



// GET: Xem Sách
router.get('/baiviet/chitiet/:id', async function (req, res) {
	var id = req.params.id;
	var cd = await ChuDe.find();
	var bv = await BaiViet.findById(id);
	if (bv) {
		bv.LuotXem += 1;
		await bv.save();  //lưu vào SQL
	}
	bv = await BaiViet.findById(id)
		.populate('ChuDe')
		.populate('TaiKhoan').exec();

	res.render('baiviet_chitiet', {
		title: 'Review chi tiết',
		chude: cd,
		baiviet: bv
	});
});


// GET: Sách theo chủ đề
router.get('/baiviet/chude/:id', async function (req, res) {
	try {
		var id = req.params.id;
		var cd = await ChuDe.find();
		var cd1 = await ChuDe.findById(id);
		var bv = await BaiViet.find({ ChuDe: id, KiemDuyet: 1 }) // Tìm các Sách có mã chủ đề = id và đã kiểm duyệt
			.populate('ChuDe')
			.populate('TaiKhoan')
			.sort({ NgayDang: -1 })
			.exec();

		res.render('baiviet_chude', {
			title: 'Sách theo chủ đề',
			chude: cd,
			baiviet_chude: cd1,
			baiviet: bv,
			firstImage: firstImage
		});
	} catch (err) {
		console.error(err);
		res.status(500).send('Có lỗi xảy ra');
	}
});



// GET: tổng hợp các chủ đề
router.get('/tinmoinhat', async function (req, res) {
	try {
		var id = req.params.id;
		var cd = await ChuDe.find();
		var bv = await BaiViet.find({ KiemDuyet: 1 }) // Tìm các Sách có mã chủ đề = id và đã kiểm duyệt
			.populate('ChuDe')
			.populate('TaiKhoan')
			.sort({ NgayDang: -1 })
			.exec();

		res.render('tinmoinhat', {
			title: 'Blog Tổng Hợp',
			chude: cd,
			baiviet: bv,
			firstImage: firstImage
		});
	} catch (err) {
		console.error(err);
		res.status(500).send('Có lỗi xảy ra');
	}
});


// GET: Hồ Sơ cá nhân
router.get('/taikhoan/hoso/:id', async function (req, res) {
	try {
		var id = req.params.id;
		var user = await User.findById(id);

		if (!user) {
			return res.status(404).send('Không tìm thấy người dùng');
		}

		res.render('hosocanhan', {
			title: 'Hồ Sơ Cá Nhân',
			user: user
		});
	} catch (err) {
		console.error(err);
		res.status(500).send('Có lỗi xảy ra');
	}
});

// POST: Kết quả tìm kiếm
router.post('/timkiem', async function (req, res) {
	var tukhoa = req.body.tukhoa;
	try {
		// Tìm các bài viết chứa từ khóa tương ứng
		if (tukhoa) {
			var ketqua = await BaiViet.find({
				KiemDuyet: 1
			}).populate('ChuDe').populate('TaiKhoan').sort({ NgayDang: 'desc' }).exec();
			const result = [];
			ketqua.forEach(item => {
				if (item.TieuDe.includes(tukhoa)) {
					result.push(item);
				}
			})
			res.render('timkiem', {
				title: 'Kết quả tìm kiếm',
				baiviet: result,
				firstImage,
				tukhoa
			});
		} else {
			req.session.error = 'Từ khóa không được trống!';
			res.redirect('/error');
		}
	} catch (error) {
		console.error(error);
		res.redirect('/error'); // Chuyển hướng đến trang lỗi nếu có lỗi xảy ra
	}
});

// GET: Lỗi
router.get('/error', async (req, res) => {
	res.render('error', {
		title: 'Lỗi'
	});
});

// GET: Thành công
router.get('/success', async (req, res) => {
	res.render('success', {
		title: 'Hoàn thành'
	});
});

module.exports = router;