interface Props {
    name: string;
    subtext?: string;
    children: any;
}

export default function ControlPanel(props: Props) {
    return <div className="container-fluid bg-dark text-white">
        <div className="row">
            <div className="col-lg-3">
                <br />
                <h5 className="text-center">{props.name}</h5>
                <small className="muted text-left">{props.subtext}</small>
            </div>
            <div className="col-lg-9">
                {props.children}
            </div>
        </div>
    </div>
}
