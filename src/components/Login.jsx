import React from "react"
import ImageFondo from '../assets/fondo.jpg'
import ImageProfile from '../assets/profile01.jpeg'


const Login = () => {
    return (
        <div className="container">
            <div className="row">
                <div className="col-md-4">
                    <div className="padre">
                        <div className="card card-body">
                            <form action="">
                                <input type="text" placeholder="Ingresar gmail" className="form-control mb-2" />
                                <input type="password" placeholder="Ingresar contraseña" className="form-control mb-2" />
                                <button className="btn btn-primary w-100">Ingresar</button>
                                
                            </form>
                        </div>
                    </div>
                </div>
                <div className="col-md-8">
                    <img src={ImageFondo} className="tamano-imagen" alt="" />
                </div>
            </div>
        </div>
    )
}

export default Login