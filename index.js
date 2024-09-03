const express = require("express");
const app = express();
const port = 3000;
const db = require("./config.js");
const User = require("./models/users.js");
const Product = require("./models/products.js");
const Message = require("./models/messages.js");
const { where, Op, fn, col } = require("sequelize");
const { createServer } = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const jwt = require("jwt-simple");
const srt = "barangrongsokchat";

const hash_password = (password) => {
  return bcrypt.hashSync(password, 10);
};

const hash_verify = (input, password) => {
  return bcrypt.compareSync(input, password);
};

const encrypt_token = (payload) => {
  return jwt.encode(payload, srt);
};

const decrypt_token = (token) => {
  return jwt.decode(token, srt);
};

const callback_send = (
  response,
  status_code,
  error = false,
  data = null,
  message = null
) => {
  return response.status(status_code).json({
    error,
    data,
    message,
  });
};

const jwt_validation = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (authHeader) {
      const [n, token] = authHeader.split(" ");
      const decrypted_token = decrypt_token(token);
      const { id } = decrypted_token;
      const user = await User.findOne({
        where: {
          user_id: id,
        },
      });
      if (user) {
        const userJson = user.toJSON();
        delete userJson.katasandi;
        req.user = userJson;
        next();
      } else {
        return callback_send(res, 401, true, {}, "Wrong Account");
      }
    }
  } catch (error) {
    console.log(error);
    return callback_send(res, 401, true, {}, "Not Authorization!");
  }
};
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://barang-rongsok-user.vercel.app",
    methods: ["GET", "POST"],
  },
});

const cors = require("cors");
const ProductLiked = require("./models/product_liked.js");

io.on("connection", (socket) => {
  console.log("chat service on");

  socket.on("authenticate", async ({ user_id }) => {
    try {
      const user = await User.findOne({
        where: {
          user_id,
        },
      });

      if (user) {
        socket.user_id = user_id;
        // Always update the socket_id to the current socket's id
        await User.update(
          { socket_id: socket.id },
          {
            where: {
              user_id,
            },
          }
        );
        console.log(
          `User ${user_id} authenticated and socket_id updated to ${socket.id}`
        );
      } else {
        console.log(`User ${user_id} not found`);
      }
    } catch (error) {
      console.error("Error during authentication:", error);
    }
  });

  socket.on(
    "broadcast",
    async ({ from_user_id, message }) => {
      try {
        let whereClause = {
          user_id: {
            [Op.not]: from_user_id
          },
        }
        const userFound = await User.findAll({
          where: whereClause
        })
        userFound.forEach(async (u) => {
          await Message.create({
            sender_id: from_user_id,
            recipient_id: u.user_id,
            message: message,
            is_read: false,
          });
          socket.emit('private_message', ({from_user_id, to_user_id: u.user_id, message}))
        })
      } catch (error) {
          console.log(error)
      }
    }
  )
  socket.on(
    "private_message",
    async ({ from_user_id, to_user_id, message }) => {
      try {
        const sender = await User.findOne({
          where: { user_id: from_user_id },
        });
        const recipient = await User.findOne({
          where: { user_id: to_user_id },
        });

        if (sender && recipient) {
          const roomId =
            sender.user_id < recipient.user_id
              ? `R_${sender.user_id}&${recipient.user_id}`
              : `R_${recipient.user_id}&${sender.user_id}`;

          socket.join(roomId);

          console.log({ roomId });

          if (message && message.length) {
            await Message.create({
              sender_id: sender.user_id,
              recipient_id: to_user_id,
              message: message,
            });
          }
          await Message.update(
            { is_read: true },
            {
              where: {
                recipient_id: sender.user_id,
                sender_id: recipient.user_id,
                is_read: false, // Only update unread messages
              },
            }
          );

          const allMessage = await Message.findAll({
            where: {
              [Op.or]: [
                {
                  sender_id: sender.user_id,
                  recipient_id: recipient.user_id,
                },
                {
                  sender_id: recipient.user_id,
                  recipient_id: sender.user_id,
                },
              ],
            },
            order: [["timestamp", "ASC"]],
          });
          io.to(roomId).emit("private_message", {
            from: sender,
            allMessage,
          });
        } else {
          console.log(
            `Recipient ${to_user_id} not connected or socket_id not found`
          );
        }

        // Save the message to the database

        console.log("Message saved to the database");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  );
});

app.use(express.json());
app.use(cors());

app.get('/admin/user' , async (req, res) => {
  const { query } = req
  try {
    let userFound = await User.findAll();
    return callback_send(res, 200, false, userFound, null)
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, null, 'Server Error')
  }
})

app.delete(`/admin/user/:id`, async (req, res) => {
  const {params} = req, {id} = params
  try {
    await User.destroy({where: {user_id: id}})
    return callback_send(res, 200, false, {}, null)
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, null, 'Server Error')
  }
})

app.get('/admin/user/:id', async (req, res) => {
  const {params} = req, {id} = params
  try {
    let user = await User.findOne({where: {user_id: id}})
    user = user.toJSON()
    delete user.katasandi
    const product = await Product.findAll({where: {
      user_id: user.user_id
    }})
    return callback_send(res, 200, false, {user, product}, null)
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, null, 'Server Error')
  }
})

app.delete(`/admin/product/:id`, async (req, res) => {
  const {params} = req, {id} = params
  try {
    await Product.destroy({where: {produk_id: id}})
    return callback_send(res, 200, false, {}, null)
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, null, 'Server Error')
  }
})


app.get('/user', jwt_validation, async (req, res) => {
  const { user, query } = req, { name } = query
  try {
    let whereClause = {
      user_id: {
        [Op.not]: user.user_id
      },
    }
    if (name && name.length) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { name_awal: { [Op.like]: `%${name}%` } },
          { nama_akhir: { [Op.like]: `%${name}%` } }
        ]
      }
    }
    let userFound = await User.findAll({
      where: whereClause
    });
    
    userFound = await Promise.all(
      userFound.map(async (u) => {
        u = u.toJSON(); // Convert Sequelize instance to plain object
        const messageUnread = await Message.findAll({
          where: {
            sender_id: u.user_id,
            is_read: false,
            recipient_id: user.user_id,
          },
        });
        u.messageUnread = messageUnread.length; // Count the unread messages
        return u;
      })
    );
    return callback_send(res, 200, false, userFound, null)
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, null, 'Server Error')
  }
})

// app.get('')
app.post("/register", async (req, res) => {
  const {
    name_awal,
    nama_akhir,
    email,
    alamat,
    katasandi,
    pertanyaan_keamanan,
    jawaban_keamanan,
  } = req.body;
  try {
    const emailExist = await User.findOne({
      where: {
        email,
      },
    });
    if (emailExist) {
      return callback_send(res, 500, true, {}, "Email already exist");
    } else {
      const newUser = await User.create({
        name_awal,
        nama_akhir,
        email,
        alamat,
        katasandi: hash_password(katasandi),
        pertanyaan_keamanan,
        jawaban_keamanan,
      });
      return callback_send(
        res,
        200,
        false,
        {
          id: newUser.user_id,
          name_awal: newUser.name_awal,
          nama_akhir: newUser.nama_akhir,
          email: newUser.email,
        },
        null
      );
    }
  } catch (error) {
    console.log(error);
    return callback_send(res, 500, true, {}, "Server Error");
  }
});



app.post("/login", async (req, res) => {
  const { alamatemail, katasandi } = req.body;
  try {
    const user = await User.findOne({
      where: {
        email: alamatemail,
      },
    });

    if (user) {
      if (hash_verify(katasandi, user.katasandi)) {
        const tokenPayload = encrypt_token({
          id: user.user_id,
        });
        await User.update({ is_online: true }, {
          where: {
            user_id: user.user_id
          }
        })

        // Convert the user instance to a plain object
        const userObject = user.toJSON();

        // Delete the password field from the plain object
        delete userObject.katasandi;

        return callback_send(
          res,
          200,
          false,
          { user: userObject, tokenPayload },
          null
        );
      } else {
        return callback_send(res, 500, true, {}, "Wrong Password");
      }
    } else {
      return callback_send(res, 500, true, {}, "Email not found");
    }
  } catch (error) {
    console.log(error);
    return callback_send(res, 500, true, {}, "Server Error");
  }
});

app.get('/logout', async (req, res) => {
  const { user_id } = req.query
  try {
    const user = await User.update({ is_online: false }, {
      where: {
        user_id
      }
    })
    if (user) {
      return callback_send(res, 200, false, {}, null)
    } else {
      return callback_send(res, 404, true, {}, 'User not found')
    }
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, {}, 'Server Error')
  }
})

app.post("/reset-password", async (req, res) => {
  const { body } = req,
    { email, securityQuestion, securityAnswer, password } = body;
  try {
    const user = await User.findOne({
      where: {
        email,
      },
    });
    if (user) {
      if (
        user.pertanyaan_keamanan == securityQuestion &&
        user.jawaban_keamanan == securityAnswer
      ) {
        await User.update(
          { katasandi: hash_password(password) },
          {
            where: {
              email,
            },
          }
        );
        return callback_send(res, 200, false, null, null)
      } else {
        return callback_send(res, 400, true, null, 'Security Question / Answer is Wrong!')
      }
    } else {
      return callback_send(res, 400, true, null, 'Email not found!')
    }
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, null, 'server error')
  }
});

app.get("/profile/:id", async (req, res) => {
  const { body, params } = req,
    { id } = params;
  try {
    let user = await User.findOne({
      where: {
        user_id: id,
      },
    });
    if (user) {
      user = user.toJSON()
      delete user.katasandi;
      return callback_send(res, 200, false, user, null)
    }
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, {}, 'Server Error')
  }
});

app.put("/profile", jwt_validation, async (req, res) => {
  const { body, user } = req,
    { alamat } = body,
    { user_id } = user;
  try {
    const user = await User.findOne({
      where: {
        user_id
      },
    });
    if (user) {
      await User.update(
        { alamat },
        {
          where: {
            user_id,
          },
        }
      );
      let updateUser = await User.findOne({
        where: {
          user_id,
        },
      });

      updateUser = updateUser.toJSON()

      return callback_send(res, 200, false, updateUser, null)
    }
  } catch (error) {
    console.log(err)
    return callback_send(res, 500, true, {}, 'Server Error')
  }
});

app.get("/product", async (req, res) => {
  const { query } = req,
    { name, category, user_id, is_available, all } = query;
  try {
    let whereClause = {};
    if (name && name.length) {
      whereClause.nama_produk = {
        [Op.like]: `%${name}%`,
      };
    }
    if (category && category.length) {
      whereClause.kategori_produk = category;
    }

    if (!all) {
      if (user_id && user_id.length) {
        whereClause.user_id = user_id;
      }
    }


    if (is_available && is_available.length) {
      whereClause.is_available = is_available == 'available' ? true : false
    }


    const product = await Product.findAll({ where: whereClause });
    console.log({ whereClause, product })
    return callback_send(res, 200, false, product, null);
  } catch (error) {
    console.log(error);
    return callback_send(res, 500, true, {}, null);
  }
});

app.post("/product", jwt_validation, async (req, res) => {
  const { body, user } = req,
    { nama_produk, harga_produk, deskripsi_produk, kategori_produk, url_foto } =
      body;
  try {
    const newProduct = await Product.create({
      nama_produk,
      harga_produk,
      deskripsi_produk,
      kategori_produk,
      url_foto,
      user_id: user.user_id,
    });

    return callback_send(
      res,
      200,
      false,
      {
        newProduct,
      },
      null
    );
  } catch (error) {
    console.log(error);
    return callback_send(res, 500, true, {}, "Server Error");
  }
});

app.put("/product/:id", async (req, res) => {
  const { body, params } = req,
    {
      nama_produk,
      harga_produk,
      deskripsi_produk,
      kategori_produk,
      url_foto,
      is_available,
    } = body,
    { id } = params;
  try {
    const productFound = await Product.findOne({
      where: {
        produk_id: id,
      },
    });
    console.log({ is_available })
    if (productFound) {
      const updateProduct = await Product.update(
        {
          nama_produk: nama_produk ?? productFound.nama_produk,
          harga_produk: harga_produk ?? productFound.harga_produk,
          deskripsi_produk: deskripsi_produk ?? productFound.deskripsi_produk,
          kategori_produk: kategori_produk ?? productFound.kategori_produk,
          url_foto: url_foto ?? productFound.url_foto,
          is_available: is_available ?? false,
        },
        {
          where: {
            produk_id: id,
          },
        }
      );
      return res.json({
        product: updateProduct,
      });
    }

    res.json({
      error: "Product not Found",
    });
  } catch (error) {
    console.log(error);
    res.json({
      error,
    });
  }
});

app.delete("/product/:id", async (req, res) => {
  const { params } = req,
    { id } = params;
  try {
    const productFound = await Product.findOne({
      where: {
        produk_id: id,
      },
    });
    if (productFound) {
      await ProductLiked.destroy({
        where: {
          produk_id: id
        }
      })

      const deleteProduct = await Product.destroy({
        where: {
          produk_id: id,
        },
      });
      return res.json({
        message: "success deleted product",
      });
    }

    return callback_send(res, 200, false, {}, null);
  } catch (error) {
    console.log(error);
    return callback_send(res, 500, true, {}, "Server Error");
  }
});

app.get("/product/:id", async (req, res) => {
  const { params } = req,
    { id } = params;
  try {
    const productFound = await Product.findOne({
      where: {
        produk_id: id,
      },
    });
    if (productFound) {
      return callback_send(res, 200, false, productFound, null)
    }

    return callback_send(res, 404, true, {}, 'Product not Found')
  } catch (error) {
    console.log(error);
    return callback_send(res, 500, true, {}, 'Server Error')
  }
});

app.post('/liked', jwt_validation, async (req, res) => {
  const { body, user } = req, { produk_id } = body
  try {
    await ProductLiked.create({
      produk_id,
      user_id: user.user_id
    })
    return callback_send(res, 201, false, {}, null)
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, {}, 'Server Error')
  }
})

app.get('/liked', jwt_validation, async (req, res) => {
  const { user } = req
  try {
    const liked = await ProductLiked.findAll({
      where: {
        user_id: user.user_id
      },
      include:
        [
          {
            model: Product // Adjust the attributes to select specific columns
          }
        ]
    })

    return callback_send(res, 200, false, liked, null)
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, {}, 'Server Error')
  }
})

app.delete('/liked/:id', jwt_validation, async (req, res) => {
  const { user, params } = req, { id } = params
  try {
    await ProductLiked.destroy({
      where: {
        user_id: user.user_id,
        produk_id: id
      }
    })
    return callback_send(res, 200, false, {}, null)
  } catch (error) {
    console.log(error)
    return callback_send(res, 500, true, {}, 'Server Error')
  }
})
db.sync()
  .then(() => {
    console.log("DB Started");
    server.listen(3001, () => {
      console.log("Server is running on port 3001");
    });
  })
  .catch((err) => {
    console.log(err);
  });
