interface Buttons {
    label: string;
    action: () => any;
    class: string;
}

interface Props {
    title: string;
    disabled?: boolean;
    onClose: () => any;
    buttons?: Buttons[];
    children?: any;
}

export default function Modal(props: Props) {
    return <div className="modal text-black" id="modal"  role="dialog" style={{display: 'block'}}>
        <div className="modal-dialog" role="document">
            <div className="modal-content" style={{width: '750px'}}>
                <div className="modal-header">
                    <h5 className="modal-title">{props.title}</h5>
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={e => props.onClose()}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body">
                    {props.children}
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={e => props.onClose()}>Close</button>
                    {props.buttons && props.buttons.map((button: Buttons) => {
                        return <button type="button" className={button.class} disabled={props?.disabled} onClick={e => button.action()}>{button.label}</button>
                    })}
                </div>
            </div>
        </div>
    </div>;
}
